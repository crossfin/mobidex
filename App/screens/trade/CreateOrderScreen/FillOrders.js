import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { ScrollView, View } from 'react-native';
import { connect as connectNavigation } from '../../../../navigation';
import { styles } from '../../../../styles';
import { navigationProp } from '../../../../types/props';
import {
  formatProduct,
  isValidAmount,
  processVirtualKeyboardCharacter
} from '../../../../utils';
import TokenAmountKeyboard from '../../../components/TokenAmountKeyboard';
import TokenAmount from '../../../components/TokenAmount';
import OrderbookPrice from '../../../views/OrderbookPrice';

class FillOrders extends PureComponent {
  static get propTypes() {
    return {
      navigation: navigationProp.isRequired,
      side: PropTypes.string.isRequired,
      base: PropTypes.object.isRequired,
      quote: PropTypes.object.isRequired
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      amount: ''
    };
  }

  render() {
    const { side } = this.props;

    return (
      <View style={[styles.flex1]}>
        <View style={[styles.flex1, styles.fluff0, styles.w100]}>
          <ScrollView contentContainerStyle={[styles.flex0, styles.p3]}>
            <TokenAmount
              containerStyle={[styles.flex4, styles.mv2, styles.mr2, styles.p0]}
              symbol={this.props.base.symbol}
              label={side === 'buy' ? 'Buying' : 'Selling'}
              amount={this.state.amount.toString()}
              cursor={true}
              cursorProps={{ style: { marginLeft: 2 } }}
              format={false}
            />
            <TokenAmount
              label={'price'}
              amount={
                <OrderbookPrice
                  product={formatProduct(
                    this.props.base.symbol,
                    this.props.quote.symbol
                  )}
                  default={0}
                  side={this.props.side}
                />
              }
              format={false}
              symbol={this.props.quote.symbol}
            />
          </ScrollView>
        </View>
        <View style={[styles.flex0, styles.fluff0]}>
          <TokenAmountKeyboard
            onChange={this.onSetAmount}
            onSubmit={this.onSubmit}
            pressMode="char"
            buttonTitle={this.renderButtonTitle()}
            disableButton={
              this.state.amount === '' || !isValidAmount(this.state.amount)
            }
          />
        </View>
      </View>
    );
  }

  renderButtonTitle = () => {
    if (this.props.side === 'buy') {
      return 'Preview Buy Order';
    } else {
      return 'Preview Sell Order';
    }
  };

  onSubmit = () => {
    const { amount } = this.state;

    if (isValidAmount(amount)) {
      const { side, base, quote } = this.props;

      this.props.navigation.showModal('modals.PreviewOrder', {
        type: 'fill',
        side,
        amount,
        base,
        quote,
        callback: error => {
          if (error) {
            this.props.navigation.showErrorModal(error);
          } else {
            this.props.navigation.pop();
          }
        }
      });
    }
  };

  onSetAmount = value => {
    const text = processVirtualKeyboardCharacter(
      value,
      this.state.amount.toString()
    );

    if (isValidAmount(text)) {
      this.setState({ amount: text, amountError: false });
    }
  };
}

export default connectNavigation(FillOrders);
