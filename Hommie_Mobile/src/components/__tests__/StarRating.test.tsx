import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StarRating } from '../StarRating';

describe('StarRating', () => {
  it('renders correct number of stars', () => {
    const { getAllByTestId } = render(
      <StarRating rating={3} maxRating={5} />
    );

    // Should have 5 star icons
    const stars = getAllByTestId('star-icon');
    expect(stars).toHaveLength(5);
  });

  it('renders filled stars correctly', () => {
    const { getByTestId } = render(
      <StarRating rating={3} maxRating={5} />
    );

    // First 3 stars should be filled, last 2 should be outline
    const star1 = getByTestId('star-icon-0');
    const star2 = getByTestId('star-icon-1');
    const star3 = getByTestId('star-icon-2');
    const star4 = getByTestId('star-icon-3');
    const star5 = getByTestId('star-icon-4');

    expect(star1).toHaveStyle({ color: '#FFC107' });
    expect(star2).toHaveStyle({ color: '#FFC107' });
    expect(star3).toHaveStyle({ color: '#FFC107' });
    expect(star4).toHaveStyle({ color: '#E0E0E0' });
    expect(star5).toHaveStyle({ color: '#E0E0E0' });
  });

  it('calls onRatingChange when star is pressed', () => {
    const onRatingChangeMock = jest.fn();
    const { getByTestId } = render(
      <StarRating 
        rating={0} 
        interactive={true}
        onRatingChange={onRatingChangeMock}
      />
    );

    // Press on 3rd star
    fireEvent.press(getByTestId('star-icon-2'));
    expect(onRatingChangeMock).toHaveBeenCalledWith(3);
  });

  it('does not call onRatingChange when not interactive', () => {
    const onRatingChangeMock = jest.fn();
    const { getByTestId } = render(
      <StarRating 
        rating={0} 
        interactive={false}
        onRatingChange={onRatingChangeMock}
      />
    );

    // Press on 3rd star
    fireEvent.press(getByTestId('star-icon-2'));
    expect(onRatingChangeMock).not.toHaveBeenCalled();
  });

  it('shows label when showLabel is true', () => {
    const { getByText } = render(
      <StarRating 
        rating={3} 
        showLabel={true}
        label="Test Rating"
      />
    );

    expect(getByText('Test Rating')).toBeTruthy();
  });

  it('shows rating text when interactive', () => {
    const { getByText } = render(
      <StarRating 
        rating={4} 
        interactive={true}
        showLabel={true}
      />
    );

    expect(getByText('Very Good')).toBeTruthy();
  });

  it('handles disabled state correctly', () => {
    const onRatingChangeMock = jest.fn();
    const { getByTestId } = render(
      <StarRating 
        rating={3} 
        interactive={true}
        disabled={true}
        onRatingChange={onRatingChangeMock}
      />
    );

    // Press on star should not call onRatingChange when disabled
    fireEvent.press(getByTestId('star-icon-2'));
    expect(onRatingChangeMock).not.toHaveBeenCalled();
  });

  it('renders different sizes correctly', () => {
    const { getByTestId } = render(
      <StarRating rating={3} size="large" />
    );

    const star = getByTestId('star-icon-0');
    expect(star).toHaveStyle({ fontSize: 24 });
  });
});
