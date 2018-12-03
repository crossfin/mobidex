import ethUtil from 'ethereumjs-util';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { ListItem } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Entypo';
import { connect } from 'react-redux';
import { connect as connectNavigation } from '../../../../navigation';
import { cancelOrder, loadOrders } from '../../../../thunks';
import * as AssetService from '../../../../services/AssetService';
import { navigationProp } from '../../../../types/props';
import CollapsibleButtonView from '../../../components/CollapsibleButtonView';
import EmptyList from '../../../components/EmptyList';
import FormattedTokenAmount from '../../../components/FormattedTokenAmount';
import MutedText from '../../../components/MutedText';
import PageRoot from '../../../components/PageRoot';
import Row from '../../../components/Row';
import Cancelling from './Cancelling';
import Cancelled from './Cancelled';

class BaseTokenOrder extends Component {
  static get propTypes() {
    return {
      order: PropTypes.object.isRequired
    };
  }

  render() {
    const { order } = this.props;

    if (!order) return null;

    const { makerAssetData, takerAssetData } = order;
    const makerToken = AssetService.findAssetByData(makerAssetData);
    const takerToken = AssetService.findAssetByData(takerAssetData);

    if (!makerToken) return null;
    if (!takerToken) return null;

    return (
      <ListItem
        roundAvatar
        bottomDivider
        title={
          <View style={styles.itemContainer}>
            <Row>
              <FormattedTokenAmount
                amount={order.makerAssetAmount}
                symbol={makerToken.symbol}
                decimals={makerToken.decimals || 18}
                style={([styles.left, styles.large], { flex: 1 })}
              />
              <Icon name="swap" color="black" size={24} />
              <FormattedTokenAmount
                amount={order.takerAssetAmount}
                symbol={takerToken.symbol}
                decimals={takerToken.decimals || 18}
                style={[
                  styles.right,
                  styles.large,
                  styles.padLeft,
                  { flex: 1 }
                ]}
              />
            </Row>
          </View>
        }
        subtitle={
          <View style={styles.itemContainer}>
            <Row>
              <MutedText style={[styles.left]}>Maker</MutedText>
              <MutedText style={[styles.right, styles.padLeft]}>
                Taker
              </MutedText>
            </Row>
          </View>
        }
        hideChevron={true}
      />
    );
  }
}

const TokenOrder = connect(
  state => ({
    ...state.relayer,
    ...state.wallet
  }),
  dispatch => ({ dispatch })
)(BaseTokenOrder);

class BaseOrdersScreen extends Component {
  static get propTypes() {
    return {
      navigation: navigationProp.isRequired,
      orders: PropTypes.array.isRequired,
      address: PropTypes.string.isRequired,
      dispatch: PropTypes.func.isRequired
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      refreshing: false,
      showCancelling: false,
      showCancelled: false
    };
  }

  componentDidMount() {
    this.onRefresh(false);
  }

  render() {
    if (this.state.showCancelled)
      return (
        <Cancelled
          onLeave={this.setState({
            showCancelled: false,
            showCancelling: false
          })}
        />
      );
    if (this.state.showCancelling) return <Cancelling />;

    const orders = this.filterOrders();

    return (
      <PageRoot>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.onRefresh}
            />
          }
        >
          {orders.length > 0 ? (
            <View style={{ width: '100%', backgroundColor: 'white' }}>
              {orders.map((order, index) => {
                return (
                  <CollapsibleButtonView
                    key={index}
                    buttonTitle={'Cancel'}
                    buttonWidth={100}
                    onPress={() => this.cancelOrder(order)}
                  >
                    <TokenOrder order={order} />
                  </CollapsibleButtonView>
                );
              })}
            </View>
          ) : (
            <EmptyList style={{ height: '100%', width: '100%' }}>
              <MutedText style={{ marginTop: 25 }}>
                No active orders to show.
              </MutedText>
            </EmptyList>
          )}
        </ScrollView>
      </PageRoot>
    );
  }

  filterOrders = () => {
    const orders = this.props.orders.filter(
      o =>
        ethUtil.stripHexPrefix(o.makerAddress).toLowerCase() ===
        ethUtil.stripHexPrefix(this.props.address).toLowerCase()
    );
    return orders;
  };

  cancelOrder = async order => {
    this.setState({ showCancelling: true });
    try {
      await this.props.dispatch(cancelOrder(order));
    } catch (error) {
      this.props.navigation.showErrorModal(error);
      return;
    } finally {
      this.setState({ showCancelling: false });
    }
    this.setState({ showCancelled: true });
    this.onRefresh();
  };

  onRefresh = async (force = true) => {
    this.setState({ refreshing: true });
    await this.props.dispatch(loadOrders(force));
    this.setState({ refreshing: false });
  };
}

const styles = {
  itemContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: '100%'
  },
  center: {
    textAlign: 'center'
  },
  padBottom: {
    marginBottom: 5
  },
  padLeft: {
    marginLeft: 10
  },
  small: {
    fontSize: 10
  },
  large: {
    fontSize: 14
  },
  right: {
    flex: 1,
    textAlign: 'right',
    marginHorizontal: 10
  }
};

export default connect(
  state => ({
    orders: state.relayer.orders,
    address: state.wallet.address
  }),
  dispatch => ({ dispatch })
)(connectNavigation(BaseOrdersScreen));
