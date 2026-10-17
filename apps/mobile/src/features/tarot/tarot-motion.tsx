import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, StyleSheet, View } from 'react-native';
import { TAROT_BACK_URI } from './tarot-artwork';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      if (!active) return;
      changed = true;
      setReduced(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active && !changed) setReduced(value);
      })
      .catch(() => {});
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

type MotionProps = {
  children: React.ReactNode;
  mode: 'shuffle' | 'select' | 'reveal';
  selected?: boolean;
  index?: number;
  reduced: boolean;
  cardFace?: boolean;
};

// One mounted instance represents an immutable backend card, keyed by reading
// and position. Ordinary renders never reset its reveal lifecycle.
function Reveal({ children, index = 0, reduced, cardFace = true }: MotionProps) {
  const [progress] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const completed = useRef(reduced);
  const [frontShown, setFrontShown] = useState(reduced);
  // Record an immediate reveal in state so disabling Reduced Motion cannot
  // hide the front again, even before the animation effect runs.
  if (reduced && !frontShown) setFrontShown(true);
  useEffect(() => {
    if (reduced || completed.current) {
      completed.current = true;
      progress.setValue(1);
      return;
    }
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    const timer = setTimeout(() => {
      animation = Animated.timing(progress, { toValue: 0.5, duration: 210, useNativeDriver: true });
      animation.start(({ finished }) => {
        if (!active || !finished) return;
        // Mount backend content only when the back reaches the edge.
        setFrontShown(true);
        animation = Animated.timing(progress, { toValue: 1, duration: 210, useNativeDriver: true });
        animation.start(({ finished: ended }) => {
          if (active && ended) completed.current = true;
        });
      });
    }, index * 520);
    return () => {
      active = false;
      clearTimeout(timer);
      animation?.stop();
      progress.stopAnimation();
    };
  }, [index, reduced, progress]);
  const shown = reduced || frontShown;
  if (!cardFace) return <View>{shown ? children : null}</View>;
  return (
    <View style={styles.frame}>
      <Animated.View
        testID={`tarot-back-${index}`}
        pointerEvents="none"
        accessibilityElementsHidden={shown}
        importantForAccessibility={shown ? 'no-hide-descendants' : 'auto'}
        style={[
          styles.backFace,
          {
            transform: [
              { perspective: 800 },
              {
                rotateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '-180deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          accessibilityLabel="Lá bài đang úp"
          source={{ uri: TAROT_BACK_URI }}
          style={styles.back}
        />
      </Animated.View>
      {shown && (
        <Animated.View
          testID={`tarot-front-${index}`}
          style={[
            styles.face,
            {
              transform: [
                { perspective: 800 },
                {
                  rotateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['180deg', '0deg'],
                  }),
                },
              ],
            },
          ]}
        >
          {children}
        </Animated.View>
      )}
    </View>
  );
}

export function TarotMotion(props: MotionProps) {
  return props.mode === 'reveal' ? <Reveal {...props} /> : <DeckMotion {...props} />;
}

function DeckMotion({ children, mode, selected = false, reduced }: MotionProps) {
  const [progress] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const animation =
      mode === 'shuffle'
        ? Animated.loop(
            Animated.sequence([
              Animated.timing(progress, { toValue: 0, duration: 220, useNativeDriver: true }),
              Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true }),
            ]),
          )
        : Animated.spring(progress, { toValue: selected ? 0 : 1, useNativeDriver: true });
    animation.start();
    return () => {
      animation.stop();
      progress.stopAnimation();
    };
  }, [mode, selected, reduced, progress]);
  return (
    <Animated.View
      style={{
        transform: reduced
          ? []
          : [
              { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
              {
                rotate: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    mode === 'shuffle' ? '-8deg' : '0deg',
                    mode === 'shuffle' ? '8deg' : '0deg',
                  ],
                }),
              },
            ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function TarotShuffle({ reduced }: { reduced: boolean }) {
  return (
    <View accessibilityLabel="Đang xáo bài">
      <TarotMotion mode="shuffle" reduced={reduced}>
        <Image source={{ uri: TAROT_BACK_URI }} style={styles.back} />
      </TarotMotion>
    </View>
  );
}
const styles = StyleSheet.create({
  frame: { minHeight: 210 },
  face: { backfaceVisibility: 'hidden' },
  backFace: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backfaceVisibility: 'hidden',
    justifyContent: 'center',
  },
  back: { width: 130, height: 210, alignSelf: 'center' },
});
