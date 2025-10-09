import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { colors, typography, spacing, BORDER_RADIUS, shadows } from '../../constants';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - (spacing.md * 2);

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface AnalyticsChartProps {
  type: 'line' | 'bar' | 'pie';
  title: string;
  data: ChartData | PieChartData[];
  height?: number;
  showLegend?: boolean;
  showDots?: boolean;
  showValues?: boolean;
}

const chartConfig = {
  backgroundColor: colors.white,
  backgroundGradientFrom: colors.white,
  backgroundGradientTo: colors.white,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 166, 81, ${opacity})`, // MeCabal green
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: BORDER_RADIUS.sm,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: colors.primary,
  },
  propsForBackgroundLines: {
    strokeDasharray: '5,5',
    stroke: colors.neutral.lightGray,
    strokeWidth: 1,
  },
  propsForLabels: {
    fontSize: typography.sizes.caption1,
    fontFamily: 'System',
  },
};

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  type,
  title,
  data,
  height = 220,
  showLegend = true,
  showDots = true,
  showValues = false,
}) => {
  const renderChart = () => {
    const commonProps = {
      data: data as any,
      width: chartWidth,
      height,
      chartConfig: {
        ...chartConfig,
        showDots,
        showValues,
      },
      style: {
        marginVertical: spacing.sm,
        borderRadius: BORDER_RADIUS.sm,
        ...shadows.small,
      },
    };

    switch (type) {
      case 'line':
        return (
          <LineChart
            {...commonProps}
            bezier
            withDots={showDots}
            withShadow={false}
            withScrollableDot={false}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={true}
            withHorizontalLines={true}
          />
        );
      
      case 'bar':
        return (
          <BarChart
            {...commonProps}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            showValuesOnTopOfBars={showValues}
            fromZero={true}
          />
        );
      
      case 'pie':
        return (
          <PieChart
            data={data as PieChartData[]}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute={false}
            style={{
              marginVertical: spacing.sm,
              borderRadius: BORDER_RADIUS.sm,
              ...shadows.small,
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        {renderChart()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: BORDER_RADIUS.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    ...shadows.small,
  },
  title: {
    fontSize: typography.sizes.headline,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
