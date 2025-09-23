import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RichTextEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  disabled?: boolean;
}

interface FormatButton {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  active?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'What\'s happening in your neighborhood?',
  maxLength = 5000,
  showCharacterCount = true,
  disabled = false,
}) => {
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const textInputRef = useRef<TextInput>(null);

  // Check if formatting is active at cursor position
  const isFormatActive = (prefix: string, suffix: string): boolean => {
    const { start, end } = selection;
    const beforeCursor = value.substring(Math.max(0, start - prefix.length), start);
    const afterCursor = value.substring(end, Math.min(value.length, end + suffix.length));
    
    return beforeCursor === prefix && afterCursor === suffix;
  };

  // Format buttons for easy text formatting
  const formatButtons: FormatButton[] = [
    {
      id: 'bold',
      icon: 'text',
      action: () => insertFormatting('**', '**'),
      active: isFormatActive('**', '**'),
    },
    {
      id: 'italic',
      icon: 'text',
      action: () => insertFormatting('*', '*'),
      active: isFormatActive('*', '*'),
    },
    {
      id: 'underline',
      icon: 'text',
      action: () => insertFormatting('__', '__'),
      active: isFormatActive('__', '__'),
    },
    {
      id: 'strikethrough',
      icon: 'remove',
      action: () => insertFormatting('~~', '~~'),
      active: isFormatActive('~~', '~~'),
    },
  ];

  // Insert formatting around selected text
  const insertFormatting = (prefix: string, suffix: string) => {
    const { start, end } = selection;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      // Replace selected text with formatted version
      const newText = value.substring(0, start) + 
        prefix + selectedText + suffix + 
        value.substring(end);
      onChange(newText);
      
      // Update cursor position
      setTimeout(() => {
        textInputRef.current?.setSelection(
          start + prefix.length + selectedText.length + suffix.length,
          start + prefix.length + selectedText.length + suffix.length
        );
      }, 0);
    } else {
      // Insert formatting at cursor position
      const newText = value.substring(0, start) + 
        prefix + suffix + 
        value.substring(start);
      onChange(newText);
      
      // Update cursor position
      setTimeout(() => {
        textInputRef.current?.setSelection(
          start + prefix.length,
          start + prefix.length
        );
      }, 0);
    }
  };

  // Insert emoji
  const insertEmoji = (emoji: string) => {
    const { start } = selection;
    const newText = value.substring(0, start) + emoji + value.substring(start);
    onChange(newText);
    
    // Update cursor position
    setTimeout(() => {
      textInputRef.current?.setSelection(
        start + emoji.length,
        start + emoji.length
      );
    }, 0);
  };

  // Quick action buttons for common Nigerian expressions
  const quickActions = [
    { text: '🙏', label: 'Blessing' },
    { text: '❤️', label: 'Love' },
    { text: '👍', label: 'Good' },
    { text: '🔥', label: 'Hot' },
    { text: '💯', label: 'Perfect' },
    { text: '🎉', label: 'Celebration' },
  ];

  // Handle text change
  const handleTextChange = (text: string) => {
    if (text.length <= maxLength) {
      onChange(text);
    }
  };

  // Handle selection change
  const handleSelectionChange = (event: any) => {
    setSelection(event.nativeEvent.selection);
  };

  // Get character count color
  const getCharacterCountColor = () => {
    const remaining = maxLength - value.length;
    if (remaining < 50) return '#e74c3c';
    if (remaining < 100) return '#f39c12';
    return '#7f8c8d';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.editorContainer}>
        {/* Formatting Toolbar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.toolbar}
        >
          {formatButtons.map((button) => (
            <TouchableOpacity
              key={button.id}
              style={[
                styles.toolbarButton,
                button.active && styles.toolbarButtonActive,
              ]}
              onPress={button.action}
              disabled={disabled}
            >
              <Ionicons
                name={button.icon}
                size={20}
                color={button.active ? '#fff' : '#7f8c8d'}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickActions}
        >
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionButton}
              onPress={() => insertEmoji(action.text)}
              disabled={disabled}
            >
              <Text style={styles.quickActionEmoji}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Text Input */}
        <TextInput
          ref={textInputRef}
          style={[styles.textInput, disabled && styles.textInputDisabled]}
          value={value}
          onChangeText={handleTextChange}
          onSelectionChange={handleSelectionChange}
          placeholder={placeholder}
          placeholderTextColor="#bdc3c7"
          multiline
          textAlignVertical="top"
          editable={!disabled}
          maxLength={maxLength}
        />

        {/* Character Count */}
        {showCharacterCount && (
          <View style={styles.characterCountContainer}>
            <Text style={[styles.characterCount, { color: getCharacterCountColor() }]}>
              {value.length}/{maxLength}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  toolbarButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  toolbarButtonActive: {
    backgroundColor: '#3498db',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  quickActionButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  quickActionEmoji: {
    fontSize: 18,
  },
  textInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    color: '#2c3e50',
    minHeight: 120,
  },
  textInputDisabled: {
    backgroundColor: '#f8f9fa',
    color: '#7f8c8d',
  },
  characterCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  characterCount: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default RichTextEditor;
