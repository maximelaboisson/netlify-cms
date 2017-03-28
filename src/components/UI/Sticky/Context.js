import React, { Component, PropTypes } from 'react';
import { castArray, fromPairs, partial, without } from 'lodash';
import { filterPairs } from '../../../lib/arrayHelper';
import styles from './Sticky.css';

export function asContext(WrappedComponent, data) {
  return class extends Component {
    static childContextTypes = {
      subscribeToContext: PropTypes.func,
      unsubscribeFromContext: PropTypes.func,
      requestUpdate: PropTypes.func,
    };

    constructor(props) {
      super(props);
      this.subscriptions = [];
    }

    subscribeToContext = (fn) => {
      this.subscriptions.push(fn);
    };

    updateSubscribers = (argsObj) => {
      this.subscriptions.forEach((fn) => fn(argsObj));
    };

    handleUpdate = () => {
      this.props.onUpdate(this.updateSubscribers);
    }

    requestUpdate = () => window.setTimeout(this.handleUpdate);

    getChildContext() {
      return {
        subscribeToContext: this.subscribeToContext,
        unsubscribeFromContext: (fn) => { this.subscriptions = without(this.subscriptions, fn) },
        requestUpdate: this.requestUpdate,
      };
    }

    componentDidMount() {
      this.handleUpdate();
    }

    handleScroll = (event) => {
      this.updateStickies(event.target);
    };

    render() {
      return (
        <div className={this.props.className} onScroll={this.handleScroll} ref={(ref) => { this.ref = ref; }}>
          {this.props.children}
        </div>
      );
    }
  }

export class StickyContainer extends Component {
  constructor(props) {
    super(props);
    this.subscriptions = [];
  }

  static contextTypes = {
    subscribeToStickyContext: PropTypes.func,
    unsubscribeToStickyContext: PropTypes.func,
    requestUpdate: PropTypes.func,
  };

  static childContextTypes = {
    subscribeToStickyContainer: PropTypes.func,
    unsubscribeToStickyContainer: PropTypes.func,
    requestUpdate: PropTypes.func,
  };

  getChildContext() {
    return {
      subscribeToStickyContainer: (fn) => { this.subscriptions.push(fn); },
      unsubscribeToStickyContainer: (fn) => { this.subscriptions = without(this.subscriptions, fn); },
      requestUpdate: () => { this.context.requestUpdate.call(this); },
    };
  }

  getPosition = (contextTop) => {
    const rect = this.ref.getBoundingClientRect();
    const shouldStick = rect.top < contextTop;
    const shouldStickAtBottom = rect.bottom - 60 < contextTop;
    this.subscriptions.forEach((fn) => { fn(shouldStick, shouldStickAtBottom, rect.width); });
  };

  componentDidMount() {
    this.context.subscribeToStickyContext(this.getPosition);
  }

  componentWillUnmount() {
    this.context.unsubscribeToStickyContext(this.getPosition);
  }

  render() {
    const className = filterPairs([
      [this.props.className],
      [styles.stickyContainer],
    ]).join(' ');

    return (
      <div id={this.context.string} className={className} ref={(ref) => { this.ref = ref; }}>
        {this.props.children}
      </div>
    );
  }
}

export class Sticky extends Component {
  static contextTypes = {
    subscribeToStickyContainer: PropTypes.func,
    unsubscribeToStickyContainer: PropTypes.func,
    requestUpdate: PropTypes.func,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {};
  }

  updateSticky = (shouldStick, shouldStickAtBottom, containerWidth) => {
    this.setState({ shouldStick, shouldStickAtBottom, containerWidth });
  };

  componentDidMount() {
    this.context.subscribeToStickyContainer(this.updateSticky);
    this.context.requestUpdate();
  }

  componentWillUnmount() {
    this.context.unsubscribeToStickyContainer(this.updateSticky);
  }

  render() {
    const { props, state } = this;
    const className = filterPairs([
      [props.className],
      [styles.sticky],
      [state.shouldStick, styles.stickyActive],
      [state.shouldStickAtBottom, styles.stickyAtBottom],
    ]).join(' ');
    const style = fromPairs([filterPairs([
      [props.fillContainerWidth && state.containerWidth, ['width', state.containerWidth]],
    ])]);
    const stickyPlaceholderHeight = state.shouldStick ? this.ref.getBoundingClientRect().height : 0;

    return (
      <div>
        <div style={{ paddingBottom: stickyPlaceholderHeight }} />
        <div className={className} style={style} ref={(ref) => { this.ref = ref; }}>{props.children}</div>
      </div>
    );
  }
}
