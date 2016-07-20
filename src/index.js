/**
 * react-native-swiper
 * @author leecade<leecade@163.com>
 */
import React from 'react'
import ReactNative, {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ViewPagerAndroid,
  Platform
} from 'react-native'

// Using bare setTimeout, setInterval, setImmediate
// and requestAnimationFrame calls is very dangerous
// because if you forget to cancel the request before
// the component is unmounted, you risk the callback
// throwing an exception.
import TimerMixin from 'react-timer-mixin'

let { width, height } = Dimensions.get('window')

/**
 * Default styles
 * @type {StyleSheetPropType}
 */
let styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    position: 'relative',
  },

  wrapper: {
    backgroundColor: 'transparent',
  },

  slide: {
    backgroundColor: 'transparent',
  },

  pagination_x: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'transparent',
  },

  pagination_y: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'transparent',
  },

  title: {
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    paddingLeft: 10,
    bottom: -30,
    left: 0,
    flexWrap: 'nowrap',
    width: 250,
    backgroundColor: 'transparent',
  },

  buttonWrapper: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    left: 0,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  buttonText: {
    fontSize: 50,
    color: '#007aff',
    fontFamily: 'Arial',
  },
})

// missing `module.exports = exports['default'];` with babel6
// export default React.createClass({
module.exports = React.createClass({

  /**
   * Props Validation
   * @type {Object}
   */
  propTypes: {
    horizontal                       : React.PropTypes.bool,
    children                         : React.PropTypes.node.isRequired,
    style                            : View.propTypes.style,
    contentContainerStyle            : View.propTypes.style,
    pagingEnabled                    : React.PropTypes.bool,
    showsHorizontalScrollIndicator   : React.PropTypes.bool,
    showsVerticalScrollIndicator     : React.PropTypes.bool,
    bounces                          : React.PropTypes.bool,
    scrollsToTop                     : React.PropTypes.bool,
    removeClippedSubviews            : React.PropTypes.bool,
    automaticallyAdjustContentInsets : React.PropTypes.bool,
    showsPagination                  : React.PropTypes.bool,
    showsButtons                     : React.PropTypes.bool,
    loop                             : React.PropTypes.bool,
    autoplay                         : React.PropTypes.bool,
    autoplayTimeout                  : React.PropTypes.number,
    autoplayDirection                : React.PropTypes.bool,
    index                            : React.PropTypes.number,
    renderPagination                 : React.PropTypes.func,
  },

  mixins: [TimerMixin],

  /**
   * Default props
   * @return {object} props
   * @see http://facebook.github.io/react-native/docs/scrollview.html
   */
  getDefaultProps() {
    return {
      horizontal                       : true,
      pagingEnabled                    : true,
      showsHorizontalScrollIndicator   : false,
      showsVerticalScrollIndicator     : false,
      bounces                          : false,
      scrollsToTop                     : false,
      removeClippedSubviews            : true,
      automaticallyAdjustContentInsets : false,
      showsPagination                  : true,
      showsButtons                     : false,
      loop                             : true,
      autoplay                         : false,
      autoplayTimeout                  : 2.5,
      autoplayDirection                : true,
      index                            : 0,
    }
  },

  /**
   * Init states
   * @return {object} states
   */
  getInitialState() {
    return this.initState(this.props)
  },

  /**
   * autoplay timer
   * @type {null}
   */
  autoplayTimer: null,

  componentWillReceiveProps(props) {
    this.setState(this.initState(props))
  },

  componentDidMount() {
    this.autoplay()
  },

  initState(props) {
    // set the current state
    const state = this.state || {}

    this.isScrolling=false;
    this.autoplayEnd=false;

    let initState = {};
    initState.total = props.children ? props.children.length : 0

    if (state.total === initState.total) {
      // retain the index
      initState.index = state.index
    } else {
      // reset the index
      initState.index = initState.total > 1 ? Math.min(props.index, initState.total - 1) : 0
    }

    // Default: horizontal
    initState.dir = props.horizontal === false ? 'y' : 'x'
    initState.width = StyleSheet.flatten(this.props.style).width || width
    initState.height = StyleSheet.flatten(this.props.style).height || height
    initState.offset = {}

    if (initState.total > 1) {
      var setup = initState.index
      initState.offset[initState.dir] = initState.dir === 'y'
        ? initState.height * setup
        : initState.width * setup
    }
    return initState
  },

  /**
   * Automatic rolling
   */
  autoplay() {
    if(
      !Array.isArray(this.props.children)
      || !this.props.autoplay
      || this.isScrolling
      || this.autoplayEnd
    ) {
      return
    }

    clearTimeout(this.autoplayTimer)

    this.autoplayTimer = this.setTimeout(() => {
      if(
        !this.props.loop && (
          this.props.autoplayDirection
            ? this.state.index === this.state.total - 1
            : this.state.index === 0
        )
      ) {
        this.autoplayEnd = true;
        return;
      }
      this.scrollBy(this.props.autoplayDirection ? 1 : -1)
    }, this.props.autoplayTimeout * 1000)
  },

  /**
   * Scroll begin handle
   * @param  {object} e native event
   */
  onScrollBegin(e) {
    // update scroll state
    this.isScrolling = true;

    this.setTimeout(() => {
      this.props.onScrollBeginDrag && this.props.onScrollBeginDrag(e, this.state, this)
    })
  },

  /**
   * Scroll end handle
   * @param  {object} e native event
   */
  onScrollEnd(e) {
    // update scroll state
    this.isScrolling = false;

    this.updateIndex(e.nativeEvent.contentOffset, this.state.dir)


    // Note: `this.setState` is async, so I call the `onMomentumScrollEnd`
    // in setTimeout to ensure synchronous update `index`
    this.setTimeout(() => {
      this.autoplay()

      // if `onMomentumScrollEnd` registered will be called here
      this.props.onMomentumScrollEnd && this.props.onMomentumScrollEnd(e, this.state, this)
    })
  },

  /*
   * Drag end handle
   * @param {object} e native event
   */
  onScrollEndDrag(e) {
    let { contentOffset } = e.nativeEvent
    let { horizontal, children } = this.props
    let { offset, index } = this.state
    let previousOffset = horizontal ? offset.x : offset.y
    let newOffset = horizontal ? contentOffset.x : contentOffset.y

    if (previousOffset === newOffset && (index === 0 || index === children.length - 1)) {
      this.isScrolling = false;
    }

    this.setTimeout(() => {
      this.props.onScrollEndDrag && this.props.onScrollEndDrag(e, this.state, this)
    })
  },

  /**
   * Update index after scroll
   * @param  {object} offset content offset
   * @param  {string} dir    'x' || 'y'
   */
  updateIndex(offset, dir) {

    let state = this.state
    let index = state.index

    let diff = offset[dir] - state.offset[dir]
    let step = dir === 'x' ? state.width : state.height

    // Do nothing if offset no change.
    if(!diff) return

    // Note: if touch very very quickly and continuous,
    // the variation of `index` more than 1.
    // parseInt() ensures it's always an integer
    index = parseInt(index + diff / step)

    if(this.props.loop) {
      if(index <= -1) {
        index = 0
        offset[dir] = step * state.total
      }
      else if(index >= state.total) {
        index = state.total - 1
        offset[dir] = step
      }
    }
    this.setState({
      index: index,
      offset: offset,
    })
  },

  /**
   * Scroll by index
   * @param  {number} index offset index
   */
  scrollBy(index) {
    if (this.isScrolling || this.state.total < 2) return
    let state = this.state
    let diff;

    diff = index + this.state.index;
    if (this.props.loop) {
      if (diff >= this.state.total) {
          diff = 0;
      }
      else if(diff<0){
        diff =this.state.total - 1;
      }
    }
    else{
      if (diff >= this.state.total) {
          diff = this.state.total - 1;
      }
      else if(diff<0){
        diff = 0;
      }
    }


    let x = 0
    let y = 0
    if(state.dir === 'x') x = diff * state.width
    if(state.dir === 'y') y = diff * state.height

    if (Platform.OS === 'android') {
      this.refs.scrollView && this.refs.scrollView.scrollTo({x,y})
    } else {
      this.refs.scrollView && this.refs.scrollView.scrollTo({ x, y })
    }

    // update scroll state

    this.isScrolling = true;
    this.autoplayEnd = false;

    // trigger onScrollEnd manually in android
    //
    if (Platform.OS === 'android') {
      this.setTimeout(() => {
        this.onScrollEnd({
          nativeEvent: {
            contentOffset: {
              x: (state.dir === 'x')?diff*state.width:0,
              y: (state.dir === 'y')?diff*state.height:0,
            }
          }
        });
      }, 50);
    }

  },

  scrollViewPropOverrides() {
    var props = this.props
    var overrides = {}

    /*
    const scrollResponders = [
      'onMomentumScrollBegin',
      'onTouchStartCapture',
      'onTouchStart',
      'onTouchEnd',
      'onResponderRelease',
    ]
    */

    for(let prop in props) {
      // if(~scrollResponders.indexOf(prop)
      if(typeof props[prop] === 'function'
        && prop !== 'onMomentumScrollEnd'
        && prop !== 'renderPagination'
        && prop !== 'onScrollBeginDrag'
      ) {
        let originResponder = props[prop]
        overrides[prop] = (e) => originResponder(e, this.state, this)
      }
    }

    return overrides
  },

  /**
   * Render pagination
   * @return {object} react-dom
   */
  renderPagination() {

    // By default, dots only show when `total` > 2
    if(this.state.total <= 1) return null

    let dots = []
    let ActiveDot = this.props.activeDot || <View style={{
            backgroundColor: '#007aff',
            width: 8,
            height: 8,
            borderRadius: 4,
            marginLeft: 3,
            marginRight: 3,
            marginTop: 3,
            marginBottom: 3,
          }} />;
    let Dot = this.props.dot || <View style={{
            backgroundColor:'rgba(0,0,0,.2)',
            width: 8,
            height: 8,
            borderRadius: 4,
            marginLeft: 3,
            marginRight: 3,
            marginTop: 3,
            marginBottom: 3,
          }} />;
    for(let i = 0; i < this.state.total; i++) {
      dots.push(i === this.state.index
        ?
        React.cloneElement(ActiveDot, {key: i})
        :
        React.cloneElement(Dot, {key: i})
      )
    }

    return (
      <View pointerEvents='none' style={[styles['pagination_' + this.state.dir], this.props.paginationStyle]}>
        {dots}
      </View>
    )
  },

  renderTitle() {
    let child = this.props.children[this.state.index]
    let title = child && child.props.title
    return title
      ? (
        <View style={styles.title}>
          {this.props.children[this.state.index].props.title}
        </View>
      )
      : null
  },

  renderNextButton() {
    let button;

    if (this.props.loop || this.state.index != this.state.total - 1) {
      button = this.props.nextButton || <Text style={styles.buttonText}>›</Text>
    }

    return (
      <TouchableOpacity onPress={() => button !== null && this.scrollBy.call(this, 1)}>
        <View>
          {button}
        </View>
      </TouchableOpacity>
    )
  },

  renderPrevButton() {
    let button = null

    if (this.props.loop || this.state.index != 0) {
       button = this.props.prevButton || <Text style={styles.buttonText}>‹</Text>
    }

    return (
      <TouchableOpacity onPress={() => button !== null && this.scrollBy.call(this, -1)}>
        <View>
          {button}
        </View>
      </TouchableOpacity>
    )
  },

  renderButtons() {
    return (
      <View pointerEvents='box-none' style={[styles.buttonWrapper, {width: this.state.width, height: this.state.height}, this.props.buttonWrapperStyle]}>
        {this.renderPrevButton()}
        {this.renderNextButton()}
      </View>
    )
  },

  renderScrollView(pages) {
     return (
        <ScrollView ref="scrollView"
           {...this.props}
           {...this.scrollViewPropOverrides()}
           contentContainerStyle={[styles.wrapper, this.props.contentContainerStyle]}
           contentOffset={this.state.offset}
           onScrollBeginDrag={this.onScrollBegin}
           onMomentumScrollEnd={this.onScrollEnd}
           onScrollEndDrag={this.onScrollEndDrag}>
         {pages}
        </ScrollView>
     );
  },

  /**
   * Default render
   * @return {object} react-dom
   */
  render() {
    let state = this.state
    let props = this.props
    let children = props.children
    let index = state.index
    let total = state.total
    let loop = props.loop
    let dir = state.dir
    let key = 0

    let pages = []
    let pageStyle = [{width: state.width, height: state.height,alignItems:'center',justifyContent:'center'}, styles.slide]

    // For make infinite at least total > 1
    if(total > 1) {
      // Re-design a loop model for avoid img flickering
      pages = Object.keys(children)

      pages = pages.map((page, i) =>
        <View style={pageStyle} key={i}>{children[page]}</View>
      )
    }
    else pages = <View style={pageStyle}>{children}</View>

    return (
      <View
        style={[styles.container,this.props.style]}
        onLayout={(arg)=>{
          if ((this.state.width !== arg.nativeEvent.layout.width) || (this.state.height !== arg.nativeEvent.layout.height)) {
            this.setState({
              index:0,
              offset:{x:0,y:0},
              width:arg.nativeEvent.layout.width,
              height:arg.nativeEvent.layout.height
            })
          }
        }}>
        {this.renderScrollView(pages)}
        {props.showsPagination && (props.renderPagination
          ? this.props.renderPagination(state.index, state.total, this)
          : this.renderPagination())}
        {this.renderTitle()}
        {this.props.showsButtons && this.renderButtons()}
      </View>
    )
  }
})
