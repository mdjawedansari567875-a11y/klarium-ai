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

export default function HomeScreen() {
  const [profile, setProfile] = useState(null);
  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState('');
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

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('klarium_profile');
      if (raw) setProfile(JSON.parse(raw));

      const savedLanguage = await AsyncStorage.getItem('klarium_language');
      if (savedLanguage) setLanguage(savedLanguage);

      // Restore chat history so it survives closing/reopening the app.
      const historyRaw = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      if (historyRaw) {
        try {
          const parsed = JSON.parse(historyRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
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

  const sendText = async () => {
    const question = input.trim();
    if (!question || sending) return;
    tapFeedback();
    setInput('');
    pushMessage({ id: Date.now() + '-u', role: 'user', text: question });
    setSending(true);
    try {
      const answer = await askTutorText({
        question,
        classNumber: profile?.classNumber,
        board: profile?.board,
        language,
      });
      pushMessage({ id: Date.now() + '-ai', role: 'ai', text: answer });
      await recordTopic(question.slice(0, 80));
    } catch (e) {
      pushErrorMessage('-err', "Sorry, I couldn't process that. Please try again.", e);
    } finally {
      setSending(false);
    }
  };

  // Shared handler for a picked image, whether it came from the camera or the gallery.
  const handlePickedAsset = async (asset) => {
    pushMessage({ id: Date.now() + '-u-img', role: 'user', image: asset.uri });
    setSending(true);
    try {
      const answer = await askTutorPhoto({
        base64Image: asset.base64,
        mimeType: 'image/jpeg',
        question: 'Please explain what is shown in this image, simply.',
        classNumber: profile?.classNumber,
        board: profile?.board,
        language,
      });
      pushMessage({ id: Date.now() + '-ai-img', role: 'ai', text: answer });
      await recordTopic('photo question');
    } catch (e) {
      pushErrorMessage('-err-img', "Sorry, I couldn't read that image. Please try again.", e);
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
    await handlePickedAsset(result.assets[0]);
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
    await handlePickedAsset(result.assets[0]);
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
    Speech.speak(text, { language: language === 'hi' ? 'hi-IN' : 'en-US' });
  };

  const renderItem = useCallback(
    ({ item }) => (
      <View
        style={[
          styles.bubble,
          item.role === 'user' ? styles.bubbleUser : styles.bubbleAi,
        ]}
      >
        {item.image && <Image source={{ uri: item.image }} style={styles.bubbleImage} />}
        {item.text ? <Text style={styles.bubbleText}>{item.text}</Text> : null}
        {item.role === 'ai' && item.text ? (
          <Pressable style={styles.speakButton} onPress={() => speakMessage(item.text)}>
            <Ionicons name="volume-medium-outline" size={16} color={colors.gold} />
            <Text style={styles.speakLabel}>Listen</Text>
          </Pressable>
        ) : null}
      </View>
    ),
    [language]
  );

  return (
    <ScreenBackground style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={typography.h1}>
          {profile?.name ? `Hi, ${profile.name}` : 'KLARIUM AI'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {profile ? `Class ${profile.classNumber} · ${profile.board}` : 'Your AI Tutor'}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.chatList}
      />

      {(sending || transcribing) && (
        <View style={styles.typingRow}>
          <ActivityIndicator color={colors.gold} size="small" />
          <Text style={styles.typingText}>
            {transcribing ? 'Listening to your voice note...' : 'KLARIUM AI is thinking...'}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <Pressable
            style={styles.iconButton}
            onPress={() => {
              tapFeedback();
              setAttachmentVisible(true);
            }}
          >
            <Ionicons name="image-outline" size={22} color={colors.gold} />
          </Pressable>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.textMuted}
            style={styles.textInput}
            multiline
          />
          <Pressable
            style={[styles.iconButton, isRecording && styles.iconButtonRecording]}
            onPress={handleMicPress}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic-outline'}
              size={22}
              color={isRecording ? '#fff' : colors.gold}
            />
          </Pressable>
          <Pressable style={styles.sendButton} onPress={sendText} disabled={sending}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <TestModal
        visible={testVisible}
        loading={testLoading}
        questions={quiz}
        onFinish={handleTestFinish}
      />

      <TutorialOverlay visible={tutorialVisible} onDone={handleTutorialDone} />

      <AttachmentSheet
        visible={attachmentVisible}
        onClose={() => setAttachmentVisible(false)}
        onCamera={openCamera}
        onGallery={openGallery}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  chatList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.gradientStart,
  },
  bubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleImage: {
    width: 180,
    height: 180,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
    alignSelf: 'flex-start',
  },
  speakLabel: {
    ...typography.caption,
    color: colors.gold,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  typingText: {
    ...typography.caption,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonRecording: {
    backgroundColor: colors.danger,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.gradientEnd,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
});
