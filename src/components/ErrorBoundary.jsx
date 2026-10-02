import { Component } from "react";
import { STORE } from "../config/store";
import "../css/ErrorBoundary.css";

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("The app crashed:", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="eb">
        <div className="eb-card">
          <h1 className="eb-title">Something went wrong</h1>
          <p className="eb-text">
            {STORE.name} hit an unexpected problem. Your saved sales are safe.
            Reload the page to continue.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}