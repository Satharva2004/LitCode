import { HStack, Image, Text } from '@chakra-ui/react';
import React from 'react';

interface LogoProps {
  compact?: boolean;
  color?: string;
}

const logoPath = `${process.env.PUBLIC_URL}/logo.png`;

const Logo: React.FC<LogoProps> = ({ compact, color = '#1f1714' }) => {
  return (
    <HStack spacing={2} align="center">
      <Image
        src={logoPath}
        alt="LitCode"
        w={compact ? '38px' : '64px'}
        h={compact ? '38px' : '64px'}
        objectFit="contain"
        borderRadius="4px"
      />
      <Text
        fontWeight="700"
        fontSize={compact ? '19px' : '22px'}
        letterSpacing="0"
        color={color}
        lineHeight="normal"
      >
        LitCode
      </Text>
    </HStack>
  );
};
export default Logo;
