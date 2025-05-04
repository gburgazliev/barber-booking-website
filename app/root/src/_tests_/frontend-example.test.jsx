// This is ES Modules syntax for the frontend
import { describe, test, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Frontend Test Example', () => {
  test('simple test', () => {
    expect(2 + 2).toBe(4);
  });
});