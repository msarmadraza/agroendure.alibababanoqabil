import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#CCCCCC';
    switch (variant) {
      case 'primary': return '#1b4332';
      case 'secondary': return '#40916c';
      case 'outline': return 'transparent';
      case 'danger': return '#d90429';
      default: return '#1b4332';
    }
  };

  const getTextColor = () => {
    if (disabled) return '#888888';
    switch (variant) {
      case 'outline': return '#1b4332';
      default: return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outlineBorder,
        size === 'small' && styles.small,
        size === 'large' && styles.large,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: getTextColor() }, size === 'small' && styles.smallText, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  outlineBorder: {
    borderWidth: 1.5,
    borderColor: '#1b4332',
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 13,
  },
});
