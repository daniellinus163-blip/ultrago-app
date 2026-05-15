import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardAvoidingView,
} from '../ui/keyboardComponents';

import { RideRequestPanel } from './RideRequestPanel';
import { AppButton } from '../ui/AppButton';
import { useDestinationVoiceSearch } from '../../hooks/useDestinationVoiceSearch';
import { NearbyDriversSection } from '../matching/NearbyDriversSection';
import type { NearbyPartner } from '../../types/partner';
import { fetchPlaceLocation, fetchPlacePredictions, type PlacePrediction } from '../../services/places/googlePlaces';
import { useFoodFavoritesStore } from '../../store/foodFavoritesStore';
import { useLoyaltyStore, tierForPoints } from '../../store/loyaltyStore';
import { useScheduledRidesStore } from '../../store/scheduledRidesStore';
import { colors, gradients } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { GeoPoint } from '../../types/geo';
import type { RideServiceCategory } from '../../types/rideServiceCategory';
import { RIDE_SERVICE_LABELS } from '../../types/rideServiceCategory';
import { buildSmartRideTip } from '../../utils/smartRecommendations';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_PEEK = 216;
const SHEET_EXPANDED = Math.min(560, Math.round(SCREEN_H * 0.78));

const RIDE_TYPES: RideServiceCategory[] = ['economy', 'premium', 'bike', 'delivery'];

type Props = {
  bottomInset: number;
  riderId: string;
  pickup: GeoPoint;
  destination: GeoPoint;
  rideCategory: RideServiceCategory;
  onRideCategoryChange: (c: RideServiceCategory) => void;
  onDestinationChange: (dest: GeoPoint) => void;
  /** When tracking an active ride, hide booking controls. */
  blocked: boolean;
  blockedMessage: string;
  onRideCreated: (rideId: string) => void;
  /** Real online drivers from Firebase (Phase 4). */
  nearbyPartners: NearbyPartner[];
  /** Count of online drivers near rider — demand pricing + map pins. */
  nearbyLiveDriverCount: number;
  /** Lock map pan/zoom while the user drags the sheet handle. */
  onMapGestureLock?: (locked: boolean) => void;
};

export function HomeBookingSheet({
  bottomInset,
  riderId,
  pickup,
  destination,
  rideCategory,
  onRideCategoryChange,
  onDestinationChange,
  blocked,
  blockedMessage,
  onRideCreated,
  nearbyPartners,
  nearbyLiveDriverCount,
  onMapGestureLock,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const sheetHeight = useRef(new Animated.Value(SHEET_PEEK)).current;
  const dragHeightAtGrant = useRef(SHEET_PEEK);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const requestSectionY = useRef(0);
  const [query, setQuery] = useState(destination.address ?? '');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedLabel, setSchedLabel] = useState('Evening commute');
  const [schedMins, setSchedMins] = useState('30');

  const loyaltyPoints = useLoyaltyStore((s) => s.points);
  const foodFavIds = useFoodFavoritesStore((s) => s.ids);
  const scheduledItems = useScheduledRidesStore((s) => s.items);
  const scheduleReminder = useScheduledRidesStore((s) => s.scheduleReminder);
  const cancelReminder = useScheduledRidesStore((s) => s.cancelReminder);

  const smartTip = useMemo(
    () => buildSmartRideTip({ foodFavoriteIds: foodFavIds, loyaltyPoints }),
    [foodFavIds, loyaltyPoints],
  );

  useEffect(() => {
    setQuery(destination.address ?? '');
  }, [destination.latitude, destination.longitude, destination.address]);

  useEffect(() => {
    Animated.spring(sheetHeight, {
      toValue: expanded ? SHEET_EXPANDED : SHEET_PEEK,
      friction: 9,
      tension: 68,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && expanded) {
        scrollRef.current?.scrollTo({
          y: Math.max(0, requestSectionY.current - spacing.md),
          animated: true,
        });
      }
    });
  }, [expanded, sheetHeight]);

  useEffect(() => {
    const event = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(event, () => setExpanded(true));
    return () => sub.remove();
  }, []);

  const snapSheet = useCallback(
    (open: boolean) => {
      setExpanded(open);
    },
    [],
  );

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          const vertical = Math.abs(gesture.dy) > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
          if (!vertical) {
            return false;
          }
          if (!expanded) {
            return true;
          }
          // When open: only drag the handle down to collapse if the list is scrolled to the top.
          return scrollY.current <= 4 && gesture.dy > 8;
        },
        onPanResponderTerminationRequest: () => expanded,
        onPanResponderGrant: () => {
          onMapGestureLock?.(true);
          sheetHeight.stopAnimation((value) => {
            dragHeightAtGrant.current =
              typeof value === 'number' ? value : expanded ? SHEET_EXPANDED : SHEET_PEEK;
          });
        },
        onPanResponderMove: (_, gesture) => {
          if (expanded && gesture.dy < 0) {
            return;
          }
          const next = Math.min(
            SHEET_EXPANDED,
            Math.max(SHEET_PEEK, dragHeightAtGrant.current - gesture.dy),
          );
          sheetHeight.setValue(next);
        },
        onPanResponderRelease: (_, gesture) => {
          onMapGestureLock?.(false);
          if (Math.abs(gesture.dy) < 8 && Math.abs(gesture.dx) < 8) {
            snapSheet(!expanded);
            return;
          }
          if (expanded) {
            const shouldCollapse = gesture.dy > 40 || gesture.vy > 0.35;
            snapSheet(!shouldCollapse);
            return;
          }
          const projected = dragHeightAtGrant.current - gesture.dy;
          const mid = (SHEET_PEEK + SHEET_EXPANDED) / 2;
          const shouldExpand = gesture.vy < -0.25 || projected > mid || gesture.dy < -48;
          snapSheet(shouldExpand);
        },
        onPanResponderTerminate: () => {
          onMapGestureLock?.(false);
        },
      }),
    [expanded, onMapGestureLock, sheetHeight, snapSheet],
  );

  const runSearch = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setPredictions([]);
      return;
    }
    setSearching(true);
    try {
      const preds = await fetchPlacePredictions(text);
      setPredictions(preds);
    } finally {
      setSearching(false);
    }
  }, []);

  const onChangeQuery = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        void runSearch(text);
      }, 380);
    },
    [runSearch],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const { listening, startListening, stopListening } = useDestinationVoiceSearch({
    onFinalTranscript: (text) => {
      setQuery(text);
      setExpanded(true);
      void runSearch(text);
    },
  });

  const onPickPrediction = useCallback(
    async (p: PlacePrediction) => {
      Keyboard.dismiss();
      setPredictions([]);
      setSearching(true);
      try {
        const loc = await fetchPlaceLocation(p.placeId);
        if (loc) {
          setQuery(loc.name);
          onDestinationChange({
            latitude: loc.latitude,
            longitude: loc.longitude,
            address: loc.name,
          });
        }
      } finally {
        setSearching(false);
      }
    },
    [onDestinationChange],
  );

  const padBottom = useMemo(() => Math.max(bottomInset, spacing.md), [bottomInset]);

  return (
    <Animated.View style={[styles.sheetOuter, styles.keyboardRoot, { height: sheetHeight }]} collapsable={false}>
      <View style={styles.handleRow} {...sheetPanResponder.panHandlers}>
        <View style={styles.handle} />
        <Text style={styles.handleHint}>
          {expanded
            ? 'Scroll down for destination & request ride · pull handle down to close'
            : 'Swipe up to open booking'}
        </Text>
      </View>

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={styles.sheetScroll}
        bottomOffset={padBottom + 24}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        scrollEnabled={expanded}
        nestedScrollEnabled
        showsVerticalScrollIndicator={expanded}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: padBottom + spacing.xl }]}
      >
        {blocked ? (
          <Text style={styles.blocked}>{blockedMessage}</Text>
        ) : (
          <>
            <Text style={styles.smartTip} numberOfLines={3}>
              {smartTip}
            </Text>
            <Text style={styles.loyaltyLine}>
              Loyalty · {tierForPoints(loyaltyPoints)} · {loyaltyPoints} pts
            </Text>

            <Text style={styles.sectionLabel}>Where to?</Text>
            <View style={styles.searchRow}>
              <View style={styles.searchGlass}>
                <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  value={query}
                  onChangeText={onChangeQuery}
                  onFocus={() => setExpanded(true)}
                  placeholder="Search address or place"
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {searching ? <ActivityIndicator size="small" color={colors.primaryDark} /> : null}
              </View>
              <Pressable
                accessibilityLabel={listening ? 'Stop voice search' : 'Start voice search'}
                onPress={() => (listening ? stopListening() : void startListening())}
                style={({ pressed }) => [styles.micBtn, pressed && styles.micBtnPressed]}
              >
                <Ionicons name={listening ? 'mic' : 'mic-outline'} size={22} color={colors.textOnPrimary} />
              </Pressable>
            </View>
            {predictions.length > 0 ? (
              <View style={styles.predGlass}>
                <FlatList
                  data={predictions}
                  keyExtractor={(item) => item.placeId}
                  keyboardShouldPersistTaps="handled"
                  scrollEnabled={predictions.length > 4}
                  style={styles.predList}
                  renderItem={({ item }) => (
                    <Pressable style={styles.predRow} onPress={() => void onPickPrediction(item)}>
                      <Ionicons name="location-outline" size={16} color={colors.primaryDark} />
                      <Text style={styles.predText} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            ) : null}

            <Pressable style={styles.scheduleLink} onPress={() => setSchedOpen(true)}>
              <Ionicons name="alarm-outline" size={18} color={colors.primary} />
              <Text style={styles.scheduleLinkTxt}>Schedule ride reminder</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
            </Pressable>
            {scheduledItems.length > 0 ? (
              <View style={styles.schedList}>
                <Text style={styles.schedListTitle}>Upcoming reminders</Text>
                {scheduledItems.map((it) => (
                  <View key={it.id} style={styles.schedRow}>
                    <Text style={styles.schedRowTxt} numberOfLines={2}>
                      {it.label} · {new Date(it.fireAt).toLocaleString()}
                    </Text>
                    <Pressable onPress={() => void cancelReminder(it.id)} hitSlop={8}>
                      <Text style={styles.schedCancel}>Cancel</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={[styles.sectionLabel, styles.sectionSpaced]}>Ride type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rideRow}>
              {RIDE_TYPES.map((id) => {
                const active = rideCategory === id;
                return (
                  <Pressable key={id} onPress={() => onRideCategoryChange(id)} style={styles.ridePress}>
                    {active ? (
                      <LinearGradient
                        colors={gradients.rideTypeActive}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.rideCardActive}
                      >
                        <Ionicons
                          name={id === 'bike' ? 'bicycle' : id === 'delivery' ? 'cube-outline' : 'car-sport'}
                          size={22}
                          color={colors.textOnPrimary}
                        />
                        <Text style={styles.rideTitleActive}>{RIDE_SERVICE_LABELS[id]}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.rideCard}>
                        <Ionicons
                          name={id === 'bike' ? 'bicycle-outline' : id === 'delivery' ? 'cube-outline' : 'car-outline'}
                          size={22}
                          color={colors.text}
                        />
                        <Text style={styles.rideTitle}>{RIDE_SERVICE_LABELS[id]}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <NearbyDriversSection partners={nearbyPartners} />

            <View
              onLayout={(e) => {
                requestSectionY.current = e.nativeEvent.layout.y;
                if (expanded && requestSectionY.current > 0) {
                  scrollRef.current?.scrollTo({
                    y: Math.max(0, requestSectionY.current - spacing.md),
                    animated: true,
                  });
                }
              }}
            >
              <Text style={styles.requestSectionLabel}>Request ride & payment</Text>
              <RideRequestPanel
                riderId={riderId}
                pickup={pickup}
                destination={destination}
                rideCategory={rideCategory}
                pickupLabelText={pickup.address ?? 'Current location'}
                destinationLabelText={destination.address ?? 'Destination'}
                nearbyLiveDriverCount={nearbyLiveDriverCount}
                onRideCreated={onRideCreated}
              />
            </View>
          </>
        )}
      </KeyboardAwareScrollView>

      <Modal visible={schedOpen} animationType="fade" transparent onRequestClose={() => setSchedOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Schedule reminder</Text>
            <Text style={styles.modalHint}>We notify on this device (local). Not a booked driver yet.</Text>
            <Text style={styles.inputLabel}>Label</Text>
            <TextInput
              value={schedLabel}
              onChangeText={setSchedLabel}
              style={styles.modalInput}
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.inputLabel}>Minutes from now (5–240)</Text>
            <TextInput
              value={schedMins}
              onChangeText={setSchedMins}
              keyboardType="number-pad"
              style={styles.modalInput}
              placeholderTextColor={colors.textMuted}
            />
            <AppButton
              title="Save reminder"
              variant="primary"
              onPress={() => {
                const mins = parseInt(schedMins, 10);
                if (!schedLabel.trim() || Number.isNaN(mins)) {
                  Alert.alert('Check fields', 'Enter a label and minutes from now.');
                  return;
                }
                void scheduleReminder({ label: schedLabel.trim(), minutesFromNow: mins }).then(() => {
                  setSchedOpen(false);
                  Alert.alert('Scheduled', 'You will get a notification when it is time to go.');
                });
              }}
            />
            <AppButton title="Close" variant="secondary" onPress={() => setSchedOpen(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    elevation: 40,
  },
  sheetOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    elevation: 40,
    flexDirection: 'column',
    backgroundColor: colors.glass,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: 52,
    justifyContent: 'center',
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.goldTint,
  },
  handleHint: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  sheetScroll: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    flexGrow: 1,
  },
  requestSectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  blocked: {
    color: colors.textMuted,
    lineHeight: 20,
    fontSize: 14,
    paddingVertical: spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  sectionSpaced: {
    marginTop: spacing.md,
  },
  smartTip: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  loyaltyLine: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  searchGlass: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryBright,
  },
  micBtnPressed: {
    opacity: 0.88,
  },
  scheduleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  scheduleLinkTxt: {
    flex: 1,
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  schedList: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  schedListTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  schedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  schedRowTxt: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  schedCancel: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: 16,
    padding: spacing.lg,
    backgroundColor: colors.backgroundMid,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 4,
  },
  predGlass: {
    marginTop: spacing.sm,
    maxHeight: 160,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
  },
  predList: {
    maxHeight: 160,
  },
  predRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  predText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  rideRow: {
    gap: 10,
    paddingVertical: spacing.sm,
  },
  ridePress: {
    marginRight: 10,
  },
  rideCard: {
    width: 104,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    gap: 6,
  },
  rideCardActive: {
    width: 104,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(196,144,0,0.55)',
  },
  rideTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  rideTitleActive: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.background,
  },
  driverRow: {
    gap: 10,
    paddingVertical: spacing.sm,
  },
  driverChip: {
    minWidth: 108,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  driverChipText: {
    marginTop: 4,
    fontWeight: '700',
    fontSize: 13,
    color: colors.text,
  },
  driverEta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  driverRating: {
    marginTop: 2,
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  noDriversHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
    paddingRight: spacing.md,
  },
});
