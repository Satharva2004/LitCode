import { Container, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import Logo from '../components/Logo';
import { Footer } from './Footer';
import { themes } from './CompleteAuthentication';

export const OnboardingLayout = ({
  children,
  step,
  totalSteps,
  colorMode = 'light',
}: {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  colorMode?: 'light' | 'dark';
}) => {
  const theme = themes[colorMode];
  return (
    <Container
      w="100%"
      maxW="100%"
      minH="268px"
      flex="1"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      flexDirection="column"
      p={0}
    >
      <VStack spacing={1} flexShrink={0}>
        <Logo compact color={theme.text} />
        <Text color={theme.muted} fontSize="10px" w="90%" textAlign="center" fontWeight="700">
          Step {step} / {totalSteps}
        </Text>
      </VStack>

      <VStack w="100%" spacing={3} flex="1" justify="center" minH={0}>
        {children}
      </VStack>
      <Footer muted={theme.muted} text={theme.text} />
    </Container>
  );
};
