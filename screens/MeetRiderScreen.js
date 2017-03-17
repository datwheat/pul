import React, { Component, PropTypes } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
} from 'react-native';
import { NavigationStyles } from '@expo/ex-navigation';
import colors from 'kolors';
import { Components, Location } from 'expo';
import ElevatedView from 'react-native-elevated-view';
import { maybeOpenURL } from 'react-native-app-link';
import connectDropdownAlert from '../utils/connectDropdownAlert';
import { phonecall } from 'react-native-communications';
import { observer } from 'mobx-react/native';
import { observable } from 'mobx';
import MapViewFloatingCard from '../components/MapViewFloatingCard';

@connectDropdownAlert
@observer
export default class MeetRiderScreen extends Component {
  static route = {
    navigationBar: {
      visible: false,
    },
    styles: {
      ...NavigationStyles.SlideHorizontal,
    },
  };

  static propTypes = {
    navigator: PropTypes.object.isRequired,
    navigation: PropTypes.object.isRequired,
    pickupLocation: PropTypes.object.isRequired,
    rider: PropTypes.object.isRequired,
    alertWithType: PropTypes.func.isRequired,
  };

  @observable region;
  @observable location;

  componentWillMount() {
    Location.watchPositionAsync(
      {
        enableHighAccuracy: true,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      data => {
        this.location = {
          latitude: data.coords.latitude,
          longitude: data.coords.longitude,
        };
      }
    ).then(locationSub => {
      this.locationSub = locationSub;
    });
  }

  componentWillUnmount() {
    this.locationSub.remove();
  }

  onRegionChange = region => this.region = region;

  render() {
    return (
      <View style={styles.container}>
        <Components.MapView
          ref={c => {
            this.map = c;
          }}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: this.props.pickupLocation.lat,
            longitude: this.props.pickupLocation.lon,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation
          followsUserLocation
          toolbarEnabled={false}
          loadingEnabled
          region={this.region}
          onRegionChange={this.onRegionChange}
        >
          <StatusBar hidden />
          <Components.MapView.Marker
            title={this.props.pickupLocation.name}
            coordinate={{
              latitude: this.props.pickupLocation.lat,
              longitude: this.props.pickupLocation.lon,
            }}
            onCalloutPress={() => {
              const wazeUrl = `waze://?ll=${this.props.pickupLocation.lat},` +
                `${this.props.pickupLocation.lon}&z=10&navigate=yes`;
              maybeOpenURL(wazeUrl, {
                appName: 'Waze',
                appStoreId: 'id323229106',
                playStoreId: 'com.waze',
              }).catch(err => {
                this.props.alertWithType('error', 'Error', err.toString());
              });
            }}
          >
            <ElevatedView style={styles.marker} elevation={5}>
              <View style={styles.markerInner} />
            </ElevatedView>
          </Components.MapView.Marker>
          <If condition={this.location}>
            <Components.MapView.Polyline
              strokeWidth={2}
              strokeColor={colors.black}
              geodesic
              lineDashPattern={[4, 8, 4, 8]}
              coordinates={[
                {
                  latitude: this.props.pickupLocation.lat,
                  longitude: this.props.pickupLocation.lon,
                },
                this.location,
              ]}
            />
          </If>
        </Components.MapView>
        <MapViewFloatingCard
          label={
            `Pickup at the ${this.props.pickupLocation.name
              .toLowerCase()
              .trim()}.`
          }
          onPress={() => this.map.animateToCoordinate({
            latitude: this.props.pickupLocation.lat,
            longitude: this.props.pickupLocation.lon,
          })}
        />
        <View style={styles.actionContainer}>
          <View>
            <Text style={styles.driverName}>
              {this.props.rider.displayName.toUpperCase()}
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => this.props.navigator.pop()}>
              <View style={[styles.button, styles.cancelButton]}>
                <Text style={styles.cancel}>CLOSE</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                phonecall(this.props.rider.phoneNumber, true);
              }}
            >
              <View style={styles.button}>
                <Text style={styles.contact}>CONTACT</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marker: {
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
    borderRadius: 12,
  },
  markerInner: {
    backgroundColor: 'white',
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  actionContainer: {
    paddingVertical: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: {
    fontFamily: 'open-sans-bold',
    color: colors.black,
    fontSize: 14,
    paddingBottom: 8,
  },
  buttonRow: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lightGrey,
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row',
  },
  button: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  cancelButton: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lightGrey,
  },
  cancel: {
    fontFamily: 'open-sans-bold',
    color: colors.hotPink,
    fontSize: 14,
  },
  contact: {
    fontFamily: 'open-sans-bold',
    color: colors.blue,
    fontSize: 14,
  },
});
