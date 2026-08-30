import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadow } from '../theme/theme';

export default function AttachmentSheet({ visible, onClose, onCamera, onGallery }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, shadow.card]} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add a Photo</Text>

          <Pressable style={styles.option} onPress={onCamera}>
            <View style={styles.iconCircle}>
              <Ionicons name="camera" size={22} color={colors.gold} />
            </View>
            <Text style={styles.optionText}>Take Photo</Text>
          </Pressable>

          <Pressable style={styles.option} onPress={onGallery}>
            <View style={styles.iconCircle}>
              <Ionicons name="images" size={22} color={colors.gold} />
            </View>
            <Text style={styles.optionText}>Choose from Gallery</Text>
          </Pressable>

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 16,
  },
  cancel: {
    marginTop: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  cancelText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
