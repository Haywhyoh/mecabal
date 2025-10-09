import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReviewCard } from '../ReviewCard';
import { BusinessReview } from '../../services/types/review.types';

// Mock data for testing
const mockReview: BusinessReview = {
  id: '1',
  businessId: 'business-1',
  userId: 'user-1',
  rating: 4,
  reviewText: 'Great service! Very professional and timely.',
  serviceQuality: 5,
  professionalism: 4,
  valueForMoney: 4,
  businessResponse: 'Thank you for your feedback!',
  respondedAt: '2024-01-15T10:30:00Z',
  createdAt: '2024-01-10T14:20:00Z',
  updatedAt: '2024-01-10T14:20:00Z',
  user: {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    profilePicture: undefined,
  },
  business: {
    id: 'business-1',
    businessName: 'Test Business',
  },
};

describe('ReviewCard', () => {
  it('renders review information correctly', () => {
    const { getByText } = render(
      <ReviewCard review={mockReview} />
    );

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('Great service! Very professional and timely.')).toBeTruthy();
    expect(getByText('Service Quality')).toBeTruthy();
    expect(getByText('Professionalism')).toBeTruthy();
    expect(getByText('Value for Money')).toBeTruthy();
  });

  it('renders business response when available', () => {
    const { getByText } = render(
      <ReviewCard review={mockReview} />
    );

    expect(getByText('Business Response')).toBeTruthy();
    expect(getByText('Thank you for your feedback!')).toBeTruthy();
  });

  it('shows respond button for business owner when no response exists', () => {
    const reviewWithoutResponse = {
      ...mockReview,
      businessResponse: undefined,
      respondedAt: undefined,
    };

    const { getByText } = render(
      <ReviewCard 
        review={reviewWithoutResponse} 
        isBusinessOwner={true}
      />
    );

    expect(getByText('Respond to Review')).toBeTruthy();
  });

  it('calls onRespond when respond button is pressed', () => {
    const onRespondMock = jest.fn();
    const reviewWithoutResponse = {
      ...mockReview,
      businessResponse: undefined,
      respondedAt: undefined,
    };

    const { getByText } = render(
      <ReviewCard 
        review={reviewWithoutResponse} 
        isBusinessOwner={true}
        onRespond={onRespondMock}
      />
    );

    fireEvent.press(getByText('Respond to Review'));
    expect(onRespondMock).toHaveBeenCalledWith('1');
  });

  it('does not show respond button for non-business owners', () => {
    const { queryByText } = render(
      <ReviewCard 
        review={mockReview} 
        isBusinessOwner={false}
      />
    );

    expect(queryByText('Respond to Review')).toBeNull();
  });

  it('renders correct number of stars for rating', () => {
    const { getAllByTestId } = render(
      <ReviewCard review={mockReview} />
    );

    // Should have 5 star icons (4 filled, 1 outline)
    const stars = getAllByTestId('star-icon');
    expect(stars).toHaveLength(5);
  });
});
