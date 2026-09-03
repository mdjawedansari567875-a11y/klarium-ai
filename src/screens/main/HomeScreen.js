import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import TestModal from '../../components/TestModal';
import TutorialOverlay from '../../components/TutorialOverlay';
import AttachmentSheet from '../../components/AttachmentSheet';
import FormattedText from '../../components/FormattedText';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';
import { tapFeedback } from '../../utils/haptics';
import {
  askTutorText,
  askTutorPhoto,
  generateWeeklyQuiz,
  transcribeAudio,
} from '../../services/geminiService';
import {
  recordActiveDay,
  recordTopic,
  getWeekTopics,
  shouldTriggerWeeklyTest,
  markTestShown,
  saveTestScore,
} from '../../services/progressService';

const CHAT_HISTORY_KEY = 'klarium_chat_history';
const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'ai',
  text: "Hi! I'm KLARIUM AI 🌟 Ask me anything from your syllabus, or send a photo of a question and I'll explain it simply.",
};

// Used only to pick a voice for "Listen" — checks if the text contains
// Devanagari characters (Hindi script) to decide which speech language to use.
function detectSpeechLanguage(text) {
  return /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-US';
}

export default function HomeScreen() {
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState(null); // { uri, base64 } picked but not sent yet
  const [sending, setSending] = useState(false);
  const [testVisible, setTestVisible] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [quiz, setQuiz] = useState([]);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [attachmentVisible, setAttachmentVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const listRef = useRef(null);
  const recordingRef = useRef(null);
  // Tracks the conversation in the format Gemini expects, so the AI
  // remembers what was already discussed instead of starting fresh every
  // message. Capped to the last 20 turns to keep requests reasonably sized.
  const historyRef = useRef([]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('klarium_profile');
      if (raw) setProfile(JSON.parse(raw));

      // Restore chat history so it survives closing/reopening the app.
      const historyRaw = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      if (historyRaw) {
        try {
          const parsed = JSON.parse(historyRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            // Rebuild the AI's conversation memory from the restored messages
            // (text-only turns), so context carries over across app restarts.
            historyRef.current = parsed
              .filter((m) => m.id !== 'welcome' && m.text)
              .map((m) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }],
              }))
              .slice(-20);
          }
        } catch {}
      }
      setHistoryLoaded(true);

      await recordActiveDay();
      await checkWeeklyTest();

      const tutorialSeen = await AsyncStorage.getItem('klarium_tutorial_seen');
      if (tutorialSeen !== 'true') {
        setTutorialVisible(true);
      }
    })();
  }, []);

  // Persist chat history every time it changes, once the initial load is done
  // (avoids overwriting saved history with the default welcome message).
  useEffect(() => {
    if (!historyLoaded) return;
    AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages)).catch(() => {});
  }, [messages, historyLoaded]);

  const handleTutorialDone = async () => {
    setTutorialVisible(false);
    await AsyncStorage.setItem('klarium_tutorial_seen', 'true');
  };

  const checkWeeklyTest = async () => {
    const shouldShow = await shouldTriggerWeeklyTest();
    if (shouldShow) {
      setTestVisible(true);
      setTestLoading(true);
      try {
        const topics = await getWeekTopics();
        const savedProfile = JSON.parse((await AsyncStorage.getItem('klarium_profile')) || '{}');
        const topicList = topics.length ? topics : ['general revision'];
        const generated = await generateWeeklyQuiz({
          topics: topicList,
          classNumber: savedProfile.classNumber,
          board: savedProfile.board,
        });
        setQuiz(generated);
      } catch (e) {
        setQuiz([]);
      } finally {
        setTestLoading(false);
      }
    }
  };

  const handleTestFinish = async (score, total) => {
    setTestVisible(false);
    const savedProfile = JSON.parse((await AsyncStorage.getItem('klarium_profile')) || '{}');
    await saveTestScore({ name: savedProfile.name || 'Student', score, total });
    await markTestShown();
  };

  const pushMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const pushErrorMessage = (idSuffix, fallbackText, e) => {
    pushMessage({
      id: Date.now() + idSuffix,
      role: 'ai',
      text:
        e.message === 'NO_API_KEY'
          ? 'Please add your Gemini API key in Settings first so I can start teaching you.'
          : e.message === 'API_KEY_EXPIRED'
          ? 'Your API key expired after 24 hours. Please go to Settings and generate/save your key again to keep chatting.'
          : e.message === 'QUOTA_EXCEEDED'
          ? 'Your free API key has reached its usage limit. Please generate a new API key in Settings to keep chatting.'
          : fallbackText,
    });
  };

  // Handles sending whatever is currently staged: text only, a pending image
  // only, or an image with a caption typed alongside it (attach-then-caption
  // flow — the image is picked first and sits as a preview until the student
  // taps send).
  const sendText = async () => {
    const question = input.trim();
    const imageToSend = pendingImage;
    if (!question && !imageToSend) return;
    if (sending) return;
    tapFeedback();

    setInput('');
    setPendingImage(null);
    pushMessage({
      id: Date.now() + '-u',
      role: 'user',
      text: question || undefined,
      image: imageToSend?.uri,
    });
    setSending(true);
    try {
      let answer;
      if (imageToSend) {
        const photoQuestion = question || 'Please explain what is shown in this image, simply.';
        answer = await askTutorPhoto({
          base64Image: imageToSend.base64,
          mimeType: 'image/jpeg',
          question: photoQuestion,
          classNumber: profile?.classNumber,
          board: profile?.board,
          history: historyRef.current,
        });
        // The image itself isn't stored in history (too large) — just a text
        // placeholder so future turns know a photo question happened here.
        historyRef.current = [
          ...historyRef.current,
          { role: 'user', parts: [{ text: '[Sent a photo] ' + photoQuestion }] },
          { role: 'model', parts: [{ text: answer }] },
        ].slice(-20);
        await recordTopic('photo question');
      } else {
        answer = await askTutorText({
          question,
          classNumber: profile?.classNumber,
          board: profile?.board,
          history: historyRef.current,
        });
        historyRef.current = [
          ...historyRef.current,
          { role: 'user', parts: [{ text: question }] },
          { role: 'model', parts: [{ text: answer }] },
        ].slice(-20);
        await recordTopic(question.slice(0, 80));
      }
      pushMessage({ id: Date.now() + '-ai', role: 'ai', text: answer });
    } catch (e) {
      pushErrorMessage('-err', "Sorry, I couldn't process that. Please try again.", e);
    } finally {
      setSending(false);
    }
  };

  const openCamera = async () => {
    setAttachmentVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.6,
    });
    if (result.canceled) return;
    // Just stage it as a preview — don't send yet, so the student can add a caption.
    setPendingImage(result.assets[0]);
  };

  const openGallery = async () => {
    setAttachmentVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.6,
    });
    if (result.canceled) return;
    setPendingImage(result.assets[0]);
  };

  // Mic button: first tap starts recording, second tap stops it, transcribes
  // it with Gemini, and drops the recognized text into the input box so the
  // student can review (or edit) it before sending — just like a voice note
  // that becomes editable text.
  const handleMicPress = async () => {
    tapFeedback();
    if (isRecording) {
      setIsRecording(false);
      const recording = recordingRef.current;
      recordingRef.current = null;
      if (!recording) return;

      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setTranscribing(true);
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const text = await transcribeAudio({ base64Audio, mimeType: 'audio/m4a' });
        setInput((prev) => (prev ? `${prev} ${text}` : text));
      } catch (e) {
        pushErrorMessage(
          '-err-voice',
          "Sorry, I couldn't understand that recording. Please try again.",
          e
        );
      } finally {
        setTranscribing(false);
      }
      return;
    }

    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) return;

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recordingRef.current = recording;
    setIsRecording(true);
  };

  const speakMessage = (text) => {
    tapFeedback();
    Speech.stop();
    // Strip ** markers before speaking so the voice doesn't say "asterisk asterisk".
    const plain = text.replace(/\*\*/g, '');
    Speech.speak(plain, { language: detectSpeechLanguage(text) });
  };

  const renderItem = useCallback(({ item }) => {
    const isImageOnly = !!item.image && !item.text;
    return (
      <View
        style={[
          styles.bubble,
          item.role === 'user' ? styles.bubbleUser : styles.bubbleAi,
          isImageOnly && styles.bubbleImageOnly,
        ]}
      >
        {item.image && <Image source={{ uri: item.image }} style={styles.bubbleImage} />}
        {item.text ? <FormattedText text={item.text} style={styles.bubbleText} />
