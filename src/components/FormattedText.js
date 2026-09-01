import React from 'react';
import { Text } from 'react-native';

// Splits text on **bold** markers and renders those parts as bold —
// everything else stays as normal text. This is the only formatting
// KLARIUM AI's system prompt is allowed to use, so this simple parser
// is enough (no need for a full markdown library).
export default function FormattedText({ text, style, boldStyle }) {
  if (!text) return null;

  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const inner = part.slice(2, -2);
          return (
            <Text key={i} style={[style, { fontWeight: '700' }, boldStyle]}>
              {inner}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}
