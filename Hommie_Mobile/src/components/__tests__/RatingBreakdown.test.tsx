import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RatingBreakdown } from '../RatingBreakdown';
import { ReviewStats } from '../../services/types/review.types';

// Mock data for testing
const mockStats: ReviewStats = {
  averageRating: 4.2,
  totalReviews: 25,
  ratingBreakdown: {
    5: 10,
    4: 8,
    3: 4,
    2: 2,
    1: 1,
  },
  averageServiceQuality: 4.5,
  averageProfessionalism: 4.0,
  averageValueForMoney: 3.8,
};

describe('RatingBreakdown', () => {
  it('renders overall rating correctly', () => {
    const { getByText } = render(
      <RatingBreakdown stats={mockStats} />
    );

    expect(getByText('4.2')).toBeTruthy();
    expect(getByText('/5')).toBeTruthy();
    expect(getByText('Based on 25 reviews')).toBeTruthy();
  });

  it('renders rating breakdown bars', () => {
    const { getByText } = render(
      <RatingBreakdown stats={mockStats} />
    );

    expect(getByText('5')).toBeTruthy();
    expect(getByText('4')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
  });

  it('shows correct counts for each rating', () => {
    const { getByText } = render(
      <RatingBreakdown stats={mockStats} />
    );

    expect(getByText('10')).toBeTruthy(); // 5-star count
    expect(getByText('8')).toBeTruthy();  // 4-star count
    expect(getByText('4')).toBeTruthy();  // 3-star count
    expect(getByText('2')).toBeTruthy();  // 2-star count
    expect(getByText('1')).toBeTruthy();  // 1-star count
  });

  it('renders detailed averages when available', () => {
    const { getByText } = render(
      <RatingBreakdown stats={mockStats} />
    );

    expect(getByText('Detailed Averages')).toBeTruthy();
    expect(getByText('Service Quality')).toBeTruthy();
    expect(getByText('Professionalism')).toBeTruthy();
    expect(getByText('Value for Money')).toBeTruthy();
  });

  it('calls onRatingFilter when rating row is pressed', () => {
    const onRatingFilterMock = jest.fn();
    const { getByText } = render(
      <RatingBreakdown 
        stats={mockStats} 
        onRatingFilter={onRatingFilterMock}
      />
    );

    // Press on 5-star rating
    fireEvent.press(getByText('5'));
    expect(onRatingFilterMock).toHaveBeenCalledWith(5);
  });

  it('shows clear filter button when rating is selected', () => {
    const { getByText } = render(
      <RatingBreakdown 
        stats={mockStats} 
        selectedRating={5}
      />
    );

    expect(getByText('Clear Filter')).toBeTruthy();
  });

  it('calls onRatingFilter with undefined when clear filter is pressed', () => {
    const onRatingFilterMock = jest.fn();
    const { getByText } = render(
      <RatingBreakdown 
        stats={mockStats} 
        selectedRating={5}
        onRatingFilter={onRatingFilterMock}
      />
    );

    fireEvent.press(getByText('Clear Filter'));
    expect(onRatingFilterMock).toHaveBeenCalledWith(undefined);
  });

  it('highlights selected rating row', () => {
    const { getByText } = render(
      <RatingBreakdown 
        stats={mockStats} 
        selectedRating={5}
      />
    );

    const fiveStarRow = getByText('5').parent;
    expect(fiveStarRow).toHaveStyle({ backgroundColor: expect.any(String) });
  });

  it('renders correct number of stars for overall rating', () => {
    const { getAllByTestId } = render(
      <RatingBreakdown stats={mockStats} />
    );

    // Should have 5 star icons for overall rating
    const stars = getAllByTestId('star-icon');
    expect(stars.length).toBeGreaterThanOrEqual(5);
  });
});
