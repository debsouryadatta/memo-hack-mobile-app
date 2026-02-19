import { getErrorMessage } from "@/lib/errors";
import React, { Component, type PropsWithChildren } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type State = {
  hasError: boolean;
  errorMessage: string;
};

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      errorMessage: getErrorMessage(error),
    };
  }

  componentDidCatch(error: unknown) {
    console.error("ErrorBoundary caught:", error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            backgroundColor: "#F9FAFB",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#6B7280",
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 22,
            }}
          >
            {this.state.errorMessage}
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: "#4F46E5",
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600", fontSize: 15 }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
