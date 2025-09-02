import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../constants';
import { 
  NIGERIAN_CURRENCY_FORMATTER, 
  NIGERIAN_PAYMENT_METHODS, 
  NIGERIAN_DELIVERY_OPTIONS,
  NIGERIAN_SAFETY_TIPS,
  getNigerianPhoneCarrier 
} from '../constants/nigerianContext';

// Nigerian Currency Display Component
interface NigerianPriceProps {
  amount: number | string;
  showOriginal?: boolean;
  originalAmount?: number;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  color?: string;
}

export const NigerianPrice: React.FC<NigerianPriceProps> = ({
  amount,
  showOriginal = false,
  originalAmount,
  size = 'medium',
  color = colors.accent.marketGreen
}) => {
  const numericAmount = typeof amount === 'string' ? 
    NIGERIAN_CURRENCY_FORMATTER.parse(amount) : amount;
  
  const fontSize = {
    small: typography.sizes.sm,
    medium: typography.sizes.base,
    large: typography.sizes.lg,
    xlarge: typography.sizes['2xl']
  }[size];

  return (
    <View style={styles.priceContainer}>
      <Text style={[styles.price, { fontSize, color }]}>
        {NIGERIAN_CURRENCY_FORMATTER.format(numericAmount)}
      </Text>
      {showOriginal && originalAmount && originalAmount > numericAmount && (
        <Text style={[styles.originalPrice, { fontSize: fontSize * 0.8 }]}>
          {NIGERIAN_CURRENCY_FORMATTER.format(originalAmount)}
        </Text>
      )}
    </View>
  );
};

// Nigerian Location Badge
interface NigerianLocationProps {
  location: string;
  distance?: string;
  showDistance?: boolean;
}

export const NigerianLocation: React.FC<NigerianLocationProps> = ({
  location,
  distance,
  showDistance = false
}) => {
  return (
    <View style={styles.locationContainer}>
      <Text style={styles.locationIcon}>📍</Text>
      <Text style={styles.locationText}>{location}</Text>
      {showDistance && distance && (
        <Text style={styles.distanceText}>• {distance} away</Text>
      )}
    </View>
  );
};

// Nigerian Phone Carrier Badge
interface PhoneCarrierBadgeProps {
  phoneNumber: string;
}

export const PhoneCarrierBadge: React.FC<PhoneCarrierBadgeProps> = ({ phoneNumber }) => {
  const carrier = getNigerianPhoneCarrier(phoneNumber);
  
  if (!carrier) return null;
  
  const carrierColors = {
    'MTN': '#FFCC00',
    'Airtel': '#FF0000',
    'Glo': '#00FF00',
    '9mobile': '#00AA00'
  };

  return (
    <View style={[styles.carrierBadge, { backgroundColor: carrierColors[carrier as keyof typeof carrierColors] }]}>
      <Text style={styles.carrierText}>{carrier}</Text>
    </View>
  );
};

// Nigerian Payment Methods Selector
interface PaymentMethodsSelectorProps {
  selectedMethods: string[];
  onMethodToggle: (methodId: string) => void;
}

export const PaymentMethodsSelector: React.FC<PaymentMethodsSelectorProps> = ({
  selectedMethods,
  onMethodToggle
}) => {
  return (
    <View style={styles.paymentMethodsContainer}>
      <Text style={styles.sectionTitle}>💳 Accepted Payment Methods</Text>
      <Text style={styles.sectionSubtitle}>Select how buyers can pay you</Text>
      
      <View style={styles.methodsGrid}>
        {NIGERIAN_PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethod,
              selectedMethods.includes(method.id) && styles.paymentMethodSelected
            ]}
            onPress={() => onMethodToggle(method.id)}
          >
            <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
            <Text style={[
              styles.paymentMethodText,
              selectedMethods.includes(method.id) && styles.paymentMethodTextSelected
            ]}>
              {method.name}
            </Text>
            <Text style={styles.paymentMethodDesc}>{method.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Nigerian Delivery Options Selector
interface DeliveryOptionsSelectorProps {
  selectedOptions: string[];
  onOptionToggle: (optionId: string) => void;
}

export const DeliveryOptionsSelector: React.FC<DeliveryOptionsSelectorProps> = ({
  selectedOptions,
  onOptionToggle
}) => {
  return (
    <View style={styles.deliveryOptionsContainer}>
      <Text style={styles.sectionTitle}>🚚 Delivery Options</Text>
      <Text style={styles.sectionSubtitle}>How will you deliver to buyers?</Text>
      
      <View style={styles.optionsGrid}>
        {NIGERIAN_DELIVERY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.deliveryOption,
              selectedOptions.includes(option.id) && styles.deliveryOptionSelected
            ]}
            onPress={() => onOptionToggle(option.id)}
          >
            <View style={styles.deliveryOptionHeader}>
              <Text style={styles.deliveryOptionIcon}>{option.icon}</Text>
              <View style={styles.deliveryOptionInfo}>
                <Text style={[
                  styles.deliveryOptionName,
                  selectedOptions.includes(option.id) && styles.deliveryOptionNameSelected
                ]}>
                  {option.name}
                </Text>
                <View style={styles.deliveryOptionMeta}>
                  <Text style={styles.deliveryOptionCost}>{option.cost}</Text>
                  <Text style={styles.deliveryOptionTime}>• {option.time}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.deliveryOptionDesc}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Nigerian Safety Tips Component
export const NigerianSafetyTips: React.FC = () => {
  return (
    <View style={styles.safetyContainer}>
      <Text style={styles.sectionTitle}>🛡️ Stay Safe While Trading</Text>
      <Text style={styles.sectionSubtitle}>Follow these tips for secure transactions</Text>
      
      <View style={styles.safeTipsGrid}>
        {NIGERIAN_SAFETY_TIPS.map((tip, index) => (
          <View key={index} style={styles.safetyTip}>
            <Text style={styles.safetyTipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Nigerian Business Hours Display
interface BusinessHoursProps {
  hours: { [key: string]: string };
  isRamadan?: boolean;
}

export const NigerianBusinessHours: React.FC<BusinessHoursProps> = ({ 
  hours, 
  isRamadan = false 
}) => {
  return (
    <View style={styles.businessHoursContainer}>
      <Text style={styles.sectionTitle}>🕒 Business Hours</Text>
      {isRamadan && (
        <Text style={styles.ramadanNotice}>
          🌙 Ramadan Schedule: Adjusted hours for fasting period
        </Text>
      )}
      
      <View style={styles.hoursGrid}>
        {Object.entries(hours).map(([day, time]) => (
          <View key={day} style={styles.hourRow}>
            <Text style={styles.dayText}>{day}</Text>
            <Text style={styles.timeText}>{time}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Estate/Compound Terminology Component
interface EstateTermsProps {
  term: 'community' | 'neighborhood' | 'area';
}

export const EstateTerminology: React.FC<EstateTermsProps> = ({ term }) => {
  const nigerianTerm = {
    'community': 'Estate/Compound',
    'neighborhood': 'Estate',
    'area': 'Area/Estate'
  }[term];

  return <Text>{nigerianTerm}</Text>;
};

const styles = StyleSheet.create({
  // Price styling
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  price: {
    fontWeight: typography.weights.bold,
  },
  originalPrice: {
    color: colors.text.light,
    textDecorationLine: 'line-through',
  },

  // Location styling
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationIcon: {
    fontSize: typography.sizes.sm,
  },
  locationText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
  },
  distanceText: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },

  // Phone carrier styling
  carrierBadge: {
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  carrierText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },

  // Section styling
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: spacing.md,
  },

  // Payment methods styling
  paymentMethodsContainer: {
    marginBottom: spacing.lg,
  },
  methodsGrid: {
    gap: spacing.sm,
  },
  paymentMethod: {
    backgroundColor: colors.neutral.lightGray,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary,
  },
  paymentMethodIcon: {
    fontSize: typography.sizes.lg,
    marginBottom: spacing.xs / 2,
  },
  paymentMethodText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
    marginBottom: spacing.xs / 2,
  },
  paymentMethodTextSelected: {
    color: colors.primary,
  },
  paymentMethodDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },

  // Delivery options styling
  deliveryOptionsContainer: {
    marginBottom: spacing.lg,
  },
  optionsGrid: {
    gap: spacing.sm,
  },
  deliveryOption: {
    backgroundColor: colors.neutral.lightGray,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  deliveryOptionSelected: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary,
  },
  deliveryOptionHeader: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  deliveryOptionIcon: {
    fontSize: typography.sizes.lg,
    marginRight: spacing.sm,
  },
  deliveryOptionInfo: {
    flex: 1,
  },
  deliveryOptionName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
    marginBottom: spacing.xs / 2,
  },
  deliveryOptionNameSelected: {
    color: colors.primary,
  },
  deliveryOptionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryOptionCost: {
    fontSize: typography.sizes.sm,
    color: colors.accent.marketGreen,
    fontWeight: typography.weights.semibold,
  },
  deliveryOptionTime: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginLeft: spacing.xs,
  },
  deliveryOptionDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },

  // Safety tips styling
  safetyContainer: {
    backgroundColor: colors.neutral.offWhite,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    marginBottom: spacing.lg,
  },
  safeTipsGrid: {
    gap: spacing.xs,
  },
  safetyTip: {
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: 6,
  },
  safetyTipText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
  },

  // Business hours styling
  businessHoursContainer: {
    marginBottom: spacing.lg,
  },
  ramadanNotice: {
    fontSize: typography.sizes.sm,
    color: colors.accent.warmGold,
    backgroundColor: colors.neutral.offWhite,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  hoursGrid: {
    gap: spacing.xs,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  dayText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
  },
  timeText: {
    fontSize: typography.sizes.base,
    color: colors.text.light,
  },
});