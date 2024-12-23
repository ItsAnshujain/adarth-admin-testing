import { Image, NativeSelect } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'react-feather';
import GoogleMapReact from 'google-map-react';
import { useSearchParams } from 'react-router-dom';
import MarkerIcon from '../../../assets/pin.svg';
import { GOOGLE_MAPS_API_KEY } from '../../../utils/config';
import { useFetchMasters } from '../../../apis/queries/masters.queries';
import { indianMapCoordinates, serialize } from '../../../utils';


const styles = {
  rightSection: { pointerEvents: 'none' },
};

const defaultProps = {
  center: {
    lat: indianMapCoordinates.latitude,
    lng: indianMapCoordinates.longitude,
  },
  zoom: 5,
};

const isValidLatLng = (latitude, longitude) =>
  typeof latitude === 'number' &&
  typeof longitude === 'number' &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

const Marker = ({ title }) => <Image src={MarkerIcon} width={40} height={40} title={title} />;

const MapView = ({ lists = [] }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    data: categoryData,
    isSuccess: isCategoryDataLoaded,
    isLoading: isCategoryDataLoading,
  } = useFetchMasters(
    serialize({
      type: 'category',
      parentId: null,
      limit: 100,
      page: 1,
      sortBy: 'name',
      sortOrder: 'asc',
    }),
  );

  const [mapInstance, setMapInstance] = useState(null);
  const category = searchParams.get('category');

  const handleCategory = e => {
    if (e.target.value === 'reset') {
      searchParams.delete('category');
      setSearchParams(searchParams);
      return;
    }
    searchParams.set('category', e.target.value);
    setSearchParams(searchParams);
  };

  const centerCoordinates = useMemo(() => {
    const firstItem = lists?.[0];
    return isValidLatLng(firstItem?.location?.latitude, firstItem?.location?.longitude)
      ? { lat: firstItem.location.latitude, lng: firstItem.location.longitude }
      : defaultProps.center;
  }, [lists]);

  const getAllLocations = useMemo(() =>
    lists
      .filter(item => isValidLatLng(item?.location?.latitude, item?.location?.longitude))
      .map(item => (
        <Marker
          lat={item.location.latitude}
          lng={item.location.longitude}
          key={item._id}
          title={item?.basicInformation?.spaceName}
        />
      )),
    [lists],
  );

  const updatedCategoryList = useMemo(() => {
    if (categoryData?.docs) {
      const tempArr = [...categoryData.docs];
      tempArr.unshift({ name: 'Reset', _id: 'reset' });

      return tempArr;
    }

    return [];
  }, [categoryData]);

  useEffect(() => {
    if (mapInstance && lists?.length) {
      const bounds = new mapInstance.maps.LatLngBounds();

      // Include the default coordinates
      bounds.extend({
        lat: indianMapCoordinates.latitude,
        lng: indianMapCoordinates.longitude,
      });

      // Add valid list locations to bounds
      lists
        .filter(item => isValidLatLng(item?.location?.latitude, item?.location?.longitude))
        .forEach(item => {
          bounds.extend({
            lat: item.location.latitude,
            lng: item.location.longitude,
          });
        });

      mapInstance.map.fitBounds(bounds);
      mapInstance.map.setCenter(bounds.getCenter());
      mapInstance.map.setZoom(Math.min(5, mapInstance.map.getZoom()));
    }
  }, [lists, mapInstance]);

  return (
    <div className="relative px-5">
      <div className="h-[70vh] w-full">
        <GoogleMapReact
          bootstrapURLKeys={{ key: GOOGLE_MAPS_API_KEY, libraries: 'places' }}
          yesIWantToUseGoogleMapApiInternals
          defaultZoom={defaultProps.zoom}
          center={{
            lat: lists?.[0]?.location?.latitude
              ? +lists[0].location.latitude
              : defaultProps.center.lat,
            lng: lists?.[0]?.location?.longitude
              ? +lists[0].location.longitude
              : defaultProps.center.lng,
          }}
          onGoogleApiLoaded={({ map, maps }) => setMapInstance({ map, maps })}
        >
          {lists.length ? getAllLocations : null}
        </GoogleMapReact>
      </div>
      <div className="absolute top-5 right-20 w-64">
        <NativeSelect
          className="mr-2"
          value={category}
          onChange={e => handleCategory(e)}
          data={
            isCategoryDataLoaded
              ? updatedCategoryList.map(item => ({ label: item?.name, value: item?._id }))
              : []
          }
          styles={styles}
          disabled={isCategoryDataLoading}
          rightSection={<ChevronDown size={16} className="mt-[1px] mr-1" />}
          rightSectionWidth={40}
        />
      </div>
    </div>
  );
};

export default MapView;
