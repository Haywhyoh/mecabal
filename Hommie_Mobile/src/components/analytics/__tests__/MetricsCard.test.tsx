import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MetricsCard } from '../MetricsCard';

describe('MetricsCard', () => {
  it('renders title and value correctly', () => {
    const { getByText } = render(
      <MetricsCard
        title="Total Views"
        value={1234}
        subtitle="All time"
      />
    );

    expect(getByText('Total Views')).toBeTruthy();
    expect(getByText('1.2K')).toBeTruthy();
    expect(getByText('All time')).toBeTruthy();
  });

  it('renders with icon', () => {
    const { getByTestId } = render(
      <MetricsCard
        title="Total Views"
        value={1234}
        icon="eye"
        iconColor="#007AFF"
      />
    );

    // Icon should be present (assuming MaterialCommunityIcons renders with testID)
    expect(getByTestId('icon-eye')).toBeTruthy();
  });

  it('renders trend information', () => {
    const { getByText } = render(
      <MetricsCard
        title="Total Views"
        value={1234}
        trend="up"
        trendValue="+12%"
      />
    );

    expect(getByText('+12%')).toBeTruthy();
  });

  it('formats large numbers correctly', () => {
    const { getByText } = render(
      <MetricsCard
        title="Total Views"
        value={1500000}
      />
    );

    expect(getByText('1.5M')).toBeTruthy();
  });

  it('formats thousands correctly', () => {
    const { getByText } = render(
      <MetricsCard
        title="Total Views"
        value={15000}
      />
    );

    expect(getByText('15.0K')).toBeTruthy();
  });

  it('handles string values', () => {
    const { getByText } = render(
      <MetricsCard
        title="Conversion Rate"
        value="85.5%"
      />
    );

    expect(getByText('85.5%')).toBeTruthy();
  });

  it('calls onPress when provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <MetricsCard
        title="Total Views"
        value={1234}
        onPress={onPressMock}
      />
    );

    fireEvent.press(getByText('Total Views'));
    expect(onPressMock).toHaveBeenCalled();
  });

  it('applies custom background color', () => {
    const { getByText } = render(
      <MetricsCard
        title="Total Views"
        value={1234}
        backgroundColor="#F0F0F0"
      />
    );

    const card = getByText('Total Views').parent?.parent;
    expect(card).toHaveStyle({ backgroundColor: '#F0F0F0' });
  });
});
