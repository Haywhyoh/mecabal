import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ReviewResponseModal } from '../ReviewResponseModal';

// Mock the business review API
jest.mock('../../services/api/businessReviewApi', () => ({
  businessReviewApi: {
    respondToReview: jest.fn(),
  },
}));

describe('ReviewResponseModal', () => {
  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    businessId: 'business-1',
    reviewId: 'review-1',
    businessName: 'Test Business',
    onResponseSubmitted: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when visible', () => {
    const { getByText } = render(
      <ReviewResponseModal {...mockProps} />
    );

    expect(getByText('Respond to Review')).toBeTruthy();
    expect(getByText('Test Business')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <ReviewResponseModal {...mockProps} visible={false} />
    );

    expect(queryByText('Respond to Review')).toBeNull();
  });

  it('shows character count', () => {
    const { getByText } = render(
      <ReviewResponseModal {...mockProps} />
    );

    expect(getByText('0/500')).toBeTruthy();
  });

  it('updates character count when typing', () => {
    const { getByText, getByPlaceholderText } = render(
      <ReviewResponseModal {...mockProps} />
    );

    const textInput = getByPlaceholderText('Write your response to this review...');
    fireEvent.changeText(textInput, 'Test response');

    expect(getByText('13/500')).toBeTruthy();
  });

  it('shows error when over character limit', () => {
    const { getByText, getByPlaceholderText } = render(
      <ReviewResponseModal {...mockProps} />
    );

    const textInput = getByPlaceholderText('Write your response to this review...');
    fireEvent.changeText(textInput, 'a'.repeat(501));

    expect(getByText('Response exceeds the maximum length')).toBeTruthy();
  });

  it('disables submit button when form is invalid', () => {
    const { getByText } = render(
      <ReviewResponseModal {...mockProps} />
    );

    const submitButton = getByText('Submit Response');
    expect(submitButton.parent).toHaveStyle({ opacity: 0.5 });
  });

  it('enables submit button when form is valid', () => {
    const { getByText, getByPlaceholderText } = render(
      <ReviewResponseModal {...mockProps} />
    );

    const textInput = getByPlaceholderText('Write your response to this review...');
    fireEvent.changeText(textInput, 'Valid response');

    const submitButton = getByText('Submit Response');
    expect(submitButton.parent).not.toHaveStyle({ opacity: 0.5 });
  });

  it('calls onClose when cancel button is pressed', () => {
    const { getByText } = render(
      <ReviewResponseModal {...mockProps} />
    );

    fireEvent.press(getByText('Cancel'));
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('shows confirmation dialog when canceling with text', () => {
    const { getByText, getByPlaceholderText } = render(
      <ReviewResponseModal {...mockProps} />
    );

    const textInput = getByPlaceholderText('Write your response to this review...');
    fireEvent.changeText(textInput, 'Some text');

    fireEvent.press(getByText('Cancel'));
    
    // Should show confirmation dialog
    expect(getByText('Discard Response?')).toBeTruthy();
  });
});
