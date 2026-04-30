interface FieldError {
  message?: string;
}

interface SignalFormFieldState {
  invalid(): boolean;
  touched(): boolean;
  errors(): FieldError[];
}

type SignalFormFieldAccessor = () => SignalFormFieldState;
export function getFormFieldError(field: SignalFormFieldAccessor, overrideMessage?: string | null) {
  if (overrideMessage) {
    return overrideMessage;
  }

  const state = field();
  if (state.invalid() && state.touched()) {
    return state.errors()[0]?.message ?? null;
  }

  return null;
}