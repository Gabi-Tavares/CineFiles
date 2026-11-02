import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MAX_RATING, MIN_RATING } from '../contexts/movieCollection';

const STARS = Array.from(
  { length: MAX_RATING - MIN_RATING + 1 },
  (_value, index) => MIN_RATING + index,
);

type StarRatingProps = {
  /** Nota atual de 1 a 5, ou `null` quando o filme ainda não foi avaliado. */
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: number;
};

export function StarRating({
  value,
  onChange,
  disabled = false,
  size = 34,
}: StarRatingProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Sua avaliação, de 1 a 5 estrelas"
      style={styles.container}
    >
      {STARS.map((star) => {
        const isFilled = value !== null && star <= value;
        return (
          <Pressable
            accessibilityLabel={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === star, disabled }}
            disabled={disabled}
            hitSlop={6}
            key={star}
            onPress={() => onChange(star)}
            style={({ pressed }) => [
              styles.star,
              pressed && !disabled && styles.pressed,
              disabled && styles.disabled,
            ]}
          >
            <Text
              style={[
                styles.icon,
                { fontSize: size, lineHeight: size * 1.12 },
                isFilled ? styles.filled : styles.empty,
              ]}
            >
              {isFilled ? '★' : '☆'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row' },
  star: { paddingHorizontal: 3 },
  pressed: { opacity: 0.6, transform: [{ scale: 0.92 }] },
  disabled: { opacity: 0.45 },
  icon: { fontWeight: '400' },
  filled: { color: '#F6C453' },
  empty: { color: '#5A5E6D' },
});
