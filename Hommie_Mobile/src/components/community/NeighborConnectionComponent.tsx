import React from 'react';
import { View } from 'react-native';
import { NeighborConnectionComponentProps } from '../types/connectionTypes';
import NeighborConnectionCard from './connection/NeighborConnectionCard';

export default function NeighborConnectionComponent(props: NeighborConnectionComponentProps) {
  return (
    <View>
      <NeighborConnectionCard {...props} />
    </View>
  );
}