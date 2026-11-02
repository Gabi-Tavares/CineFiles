import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type ListStatusProps = {
  title: string;
  message?: string;
  icon?: string;
  isLoading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function ListStatus({
  title,
  message,
  icon,
  isLoading = false,
  actionLabel,
  onAction,
}: ListStatusProps) {
  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator color="#F6C453" size="large" />
      ) : (
        icon && (
          <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.icon}>
            {icon}
          </Text>
        )
      )}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 320,
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  icon: { color: '#F6C453', fontSize: 34, fontWeight: '900' },
  title: {
    color: '#F6F4EF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  message: {
    color: '#A9ACB9',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 320,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#F6C453',
    borderRadius: 11,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: { color: '#171820', fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
