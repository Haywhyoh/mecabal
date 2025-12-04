import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import PaymentService, { PaymentProvider, PaymentMethod, PaymentRequest, PaymentResponse } from '../../services/PaymentService';
import { EventData, demoEvents } from '../../data/eventsData';
import { colors, spacing, typography, shadows } from '../../constants';

interface EventPaymentScreenProps {
  route: {
    params: {
      eventId: string;
      ticketQuantity?: number;
    };
  };
  navigation: any;
}

interface TicketSelection {
  type: 'regular' | 'vip' | 'early_bird';
  name: string;
  price: number;
  quantity: number;
  description: string;
  maxPerUser: number;
}

const EventPaymentScreen: React.FC<EventPaymentScreenProps> = ({ route, navigation }) => {
  const { eventId, ticketQuantity = 1 } = route.params;
  const [event, setEvent] = useState<EventData | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'paystack' | 'flutterwave' | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [ticketSelections, setTicketSelections] = useState<TicketSelection[]>([
    {
      type: 'regular',
      name: 'Regular Ticket',
      price: 2500,
      quantity: ticketQuantity,
      description: 'Standard event access',
      maxPerUser: 5,
    },
  ]);

  const paymentService = PaymentService.getInstance();
  const providers = paymentService.getAvailableProviders();

  // User information (would come from context/auth)
  const [userInfo] = useState({
    id: 'user123',
    email: 'user@example.com',
    phone: '+2348123456789',
    firstName: 'John',
    lastName: 'Doe',
  });

  useEffect(() => {
    const foundEvent = demoEvents.find(e => e.id === eventId);
    setEvent(foundEvent || null);
    
    // Set ticket price from event if it's a paid event
    if (foundEvent && !foundEvent.price.isFree && foundEvent.price.amount) {
      setTicketSelections([{
        type: 'regular',
        name: 'Event Ticket',
        price: foundEvent.price.amount,
        quantity: ticketQuantity,
        description: 'Access to ' + foundEvent.title,
        maxPerUser: 10,
      }]);
    }
  }, [eventId, ticketQuantity]);

  const calculateTotal = (): number => {
    return ticketSelections.reduce((total, ticket) => total + (ticket.price * ticket.quantity), 0);
  };

  const calculateFees = (): number => {
    if (!selectedProvider) return 0;
    return paymentService.calculateFees(calculateTotal(), selectedProvider);
  };

  const getFinalAmount = (): number => {
    return calculateTotal() + calculateFees();
  };

  const updateTicketQuantity = (index: number, quantity: number) => {
    const updated = [...ticketSelections];
    updated[index].quantity = Math.max(0, Math.min(quantity, updated[index].maxPerUser));
    setTicketSelections(updated);
  };

  const handleProviderSelect = (provider: PaymentProvider) => {
    setSelectedProvider(provider.id);
    setSelectedMethod(null); // Reset method when provider changes
    setShowProviderModal(false);
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    const validation = paymentService.validateAmount(paymentService.nairaToKobo(getFinalAmount()), method);
    
    if (!validation.valid) {
      Alert.alert('Invalid Amount', validation.message);
      return;
    }

    setSelectedMethod(method);
    setShowMethodModal(false);
  };

  const processPayment = async () => {
    if (!selectedProvider || !selectedMethod || !event) {
      Alert.alert('Incomplete Selection', 'Please select a payment provider and method.');
      return;
    }

    const total = getFinalAmount();
    
    Alert.alert(
      'Confirm Payment',
      `You are about to pay ₦${total.toLocaleString()} for ${event.title}. Proceed with payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay Now', 
          onPress: async () => {
            setIsProcessing(true);
            
            try {
              const paymentRequest: PaymentRequest = {
                amount: paymentService.nairaToKobo(total),
                currency: 'NGN',
                email: userInfo.email,
                phone: userInfo.phone,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                reference: paymentService.generateReference('EVENT'),
                description: `Tickets for ${event.title}`,
                eventId: event.id,
                userId: userInfo.id,
                metadata: {
                  eventTitle: event.title,
                  tickets: ticketSelections.filter(t => t.quantity > 0),
                  paymentMethod: selectedMethod.id,
                },
              };

              const response = await paymentService.processPayment(paymentRequest, selectedProvider);
              
              if (response.success) {
                paymentService.handlePaymentSuccess(response, event.id);
                // Navigate to success screen or back to event
                navigation.replace('PaymentSuccess', { 
                  response,
                  eventId: event.id,
                  tickets: ticketSelections.filter(t => t.quantity > 0),
                });
              } else {
                paymentService.handlePaymentFailure(response);
              }
            } catch (error: any) {
              Alert.alert('Payment Error', 'An error occurred while processing your payment. Please try again.');
              console.error('Payment error:', error);
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const renderTicketSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Tickets</Text>
      {ticketSelections.map((ticket, index) => (
        <View key={index} style={styles.ticketCard}>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketName}>{ticket.name}</Text>
            <Text style={styles.ticketDescription}>{ticket.description}</Text>
            <Text style={styles.ticketPrice}>₦{ticket.price.toLocaleString()}</Text>
          </View>
          
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateTicketQuantity(index, ticket.quantity - 1)}
              disabled={ticket.quantity <= 0}
            >
              <MaterialCommunityIcons 
                name="minus" 
                size={20} 
                color={ticket.quantity <= 0 ? colors.neutral.gray : colors.primary} 
              />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{ticket.quantity}</Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateTicketQuantity(index, ticket.quantity + 1)}
              disabled={ticket.quantity >= ticket.maxPerUser}
            >
              <MaterialCommunityIcons 
                name="plus" 
                size={20} 
                color={ticket.quantity >= ticket.maxPerUser ? colors.neutral.gray : colors.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderPaymentSummary = () => {
    const subtotal = calculateTotal();
    const fees = calculateFees();
    const total = getFinalAmount();

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₦{subtotal.toLocaleString()}</Text>
          </View>
          
          {fees > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Processing Fee</Text>
              <Text style={styles.summaryValue}>₦{fees.toLocaleString()}</Text>
            </View>
          )}
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₦{total.toLocaleString()}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderProviderSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment Provider</Text>
      <TouchableOpacity
        style={styles.selectionButton}
        onPress={() => setShowProviderModal(true)}
      >
        {selectedProvider ? (
          <View style={styles.selectedProvider}>
            <Text style={styles.selectionText}>
              {providers.find(p => p.id === selectedProvider)?.name}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.neutral.gray} />
          </View>
        ) : (
          <View style={styles.placeholderSelection}>
            <Text style={styles.placeholderText}>Select payment provider</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.neutral.gray} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderMethodSelection = () => {
    if (!selectedProvider) return null;

    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <TouchableOpacity
          style={styles.selectionButton}
          onPress={() => setShowMethodModal(true)}
        >
          {selectedMethod ? (
            <View style={styles.selectedMethod}>
              <MaterialCommunityIcons name={selectedMethod.icon as any} size={20} color={colors.primary} />
              <Text style={styles.selectionText}>{selectedMethod.name}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.neutral.gray} />
            </View>
          ) : (
            <View style={styles.placeholderSelection}>
              <Text style={styles.placeholderText}>Select payment method</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.neutral.gray} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderProviderModal = () => (
    <Modal
      visible={showProviderModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowProviderModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowProviderModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Provider</Text>
          <View style={{ width: 60 }} />
        </View>
        
        <ScrollView style={styles.modalContent}>
          {providers.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              style={styles.providerOption}
              onPress={() => handleProviderSelect(provider)}
            >
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerFee}>
                  {provider.fees.percentage}% fee
                  {provider.fees.cap && ` (max ₦${provider.fees.cap.toLocaleString()})`}
                </Text>
              </View>
              {selectedProvider === provider.id && (
                <MaterialCommunityIcons name="check" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderMethodModal = () => {
    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider) return null;

    return (
      <Modal
        visible={showMethodModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMethodModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMethodModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Payment Method</Text>
            <View style={{ width: 60 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {provider.supportedMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.methodOption}
                onPress={() => handleMethodSelect(method)}
              >
                <MaterialCommunityIcons name={method.icon as any} size={24} color={colors.primary} />
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                  {method.minAmount && (
                    <Text style={styles.methodLimits}>
                      Min: ₦{(method.minAmount / 100).toLocaleString()}
                      {method.maxAmount && ` • Max: ₦${(method.maxAmount / 100).toLocaleString()}`}
                    </Text>
                  )}
                </View>
                {selectedMethod?.id === method.id && (
                  <MaterialCommunityIcons name="check" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Payment</Text>
          <Text style={styles.headerSubtitle}>{event.title}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTicketSelection()}
        {renderPaymentSummary()}
        {renderProviderSelection()}
        {renderMethodSelection()}

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <MaterialCommunityIcons name="shield-check" size={20} color={colors.success} />
          <Text style={styles.securityText}>
            Your payment is secured by 256-bit SSL encryption
          </Text>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.payButtonContainer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!selectedProvider || !selectedMethod || isProcessing || calculateTotal() <= 0) && styles.payButtonDisabled
          ]}
          onPress={processPayment}
          disabled={!selectedProvider || !selectedMethod || isProcessing || calculateTotal() <= 0}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="lock" size={20} color={colors.white} />
              <Text style={styles.payButtonText}>
                Pay ₦{getFinalAmount().toLocaleString()}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {renderProviderModal()}
      {renderMethodModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  ticketCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral.offWhite,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.dark,
    marginBottom: 2,
  },
  ticketDescription: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    marginBottom: 4,
  },
  ticketPrice: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.primary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  quantityText: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
    marginHorizontal: spacing.md,
    minWidth: 30,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.neutral.offWhite,
    padding: spacing.md,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  summaryValue: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.text.dark,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
    paddingTop: spacing.sm,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
  },
  totalValue: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  selectionButton: {
    backgroundColor: colors.neutral.offWhite,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
  },
  selectedProvider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionText: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    fontWeight: '500',
    flex: 1,
    marginLeft: spacing.sm,
  },
  placeholderSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  securityText: {
    fontSize: typography.sizes.sm,
    color: colors.success,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  payButtonContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
  },
  payButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    ...shadows.medium,
  },
  payButtonDisabled: {
    backgroundColor: colors.neutral.gray,
  },
  payButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.neutral.gray,
    textAlign: 'center',
    margin: spacing.lg,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  modalCancel: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  providerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.text.dark,
    marginBottom: 2,
  },
  providerFee: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  methodInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  methodName: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.text.dark,
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    marginBottom: 2,
  },
  methodLimits: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.gray,
  },
});

export default EventPaymentScreen;