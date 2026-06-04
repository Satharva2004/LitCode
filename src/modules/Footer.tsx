import { HStack, Text } from '@chakra-ui/react';
import React from 'react';

export const Footer = ({ muted = '#735f52', text = '#1f1714' }: { muted?: string; text?: string }) => {
  return (
    <HStack align="center" justify="space-between" w="100%" spacing={2} overflow="hidden">
      <Text
        as="a"
        fontSize="10px"
        color={muted}
        href="https://github.com/Satharva2004/LitCode/issues/new/choose"
        target="_blank"
        fontWeight="700"
        whiteSpace="nowrap"
      >
        Report issue
      </Text>
      <Text fontSize="10px" color={muted} whiteSpace="nowrap" minW={0}>
        Made with ❤️ by{' '}
        <Text
          as="a"
          color={text}
          href="https://www.linkedin.com/in/atharvasawant0804"
          target="_blank"
          fontWeight={'semibold'}
        >
          Atharva S.
        </Text>
      </Text>
    </HStack>
  );
};
