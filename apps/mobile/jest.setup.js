// React 19 concurrent-act environment flag — without it, react-test-renderer's act() warnings can
// leave `render()` in a broken state under @testing-library/react-native.
global.IS_REACT_ACT_ENVIRONMENT = true;
