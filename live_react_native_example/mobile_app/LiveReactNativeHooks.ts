// LiveReactNativeHooks.ts - Provides React hooks to the library
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

// Export all React hooks that our library needs
export {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect
};

// Also export React types if needed
export type { Dispatch, SetStateAction, MutableRefObject } from 'react';
