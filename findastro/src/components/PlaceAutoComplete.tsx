import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Box, InputBase } from '@mui/material';

// Global ClickAstro CAPAC interfaces
declare global {
  interface Window {
    CAPACInitListener?: () => void;
    clickastro?: {
      places?: {
        Autocomplete: new (
          el: HTMLInputElement,
          opts?: Record<string, unknown>
        ) => {
          inputId?: string;
          addListener: (eventName: 'place_changed', cb: () => void) => void;
          getPlace: () => unknown;
        };
      };
    };
  }
}

export interface PlaceData {
  place: string;
  country: string;
  state: string;
  geo_lat: number;
  geo_long: number;
  lat: string;
  long: string;
}

interface PlaceResult {
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
}

interface PlaceAutoCompleteProps {
  placeholder?: string;
  className?: string;
  name?: string;
  onPlaceSelected?: (data: PlaceData) => void;
  onTyping?: (value: string) => void;
}

// const PlaceAutoComplete: React.FC<PlaceAutoCompleteProps> = ({
//   placeholder = 'Start typing & choose from list',
//   className,
//   name,
//   onPlaceSelected,
//   onTyping,
// }) => {
const PlaceAutoComplete = forwardRef<HTMLInputElement, PlaceAutoCompleteProps>(
  (
    { placeholder = 'Start typing & choose from list', className, name, onPlaceSelected, onTyping },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const autocompleteRef = useRef<any>(null);

    // Stable ID for the input element
    const inputId = React.useId().replace(/:/g, '');
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
    // Inject style for the suggestion dropdown
    useEffect(() => {
      const style = document.createElement('style');
      style.innerHTML = `
      .ca-pac-container { z-index: 999999 !important; position: absolute !important; }
    `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }, []);

    // Load CAPAC script and initialise autocomplete via callback
    useEffect(() => {
      // Callback invoked by the script once it’s loaded
      window.CAPACInitListener = () => {
        const el = inputRef.current;
        const AutoClass = window.clickastro?.places?.Autocomplete;
        if (!el || !AutoClass) return;

        // Ensure the input has the generated ID
        el.id = inputId;

        if (autocompleteRef.current) return;

        const autocomplete = new AutoClass(el, { types: ['(cities)'] });
        autocompleteRef.current = autocomplete;
        autocomplete.inputId = 'capac_' + inputId;

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log('Selected place:', place);
          if (onPlaceSelected && typeof place === 'object' && place !== null) {
            const p = place as PlaceResult;
            const value = el.value;
            setQuery(value);

            let country = '';
            let state = '';
            if (p.address_components) {
              for (const comp of p.address_components) {
                const types: string[] = comp.types;
                if (types.includes('country')) country = comp.long_name;
                if (types.includes('administrative_area_level_1')) state = comp.long_name;
              }
            }
            const lat = p.geometry?.location?.lat?.() ?? 0;
            const lng = p.geometry?.location?.lng?.() ?? 0;
            const latDeg = Math.abs(Math.trunc(lat));
            const latMin = Math.abs(Math.trunc((lat % 1) * 60));
            const lngDeg = Math.abs(Math.trunc(lng));
            const lngMin = Math.abs(Math.trunc((lng % 1) * 60));
            const latDir = lat > 0 ? 'N' : 'S';
            const lngDir = lng > 0 ? 'E' : 'W';
            const formattedLat = `${latDeg}.${latMin < 10 ? '0' + latMin : latMin} ${latDir}`;
            const formattedLng = `${lngDeg}.${lngMin < 10 ? '0' + lngMin : lngMin} ${lngDir}`;
            const data: PlaceData = {
              place: value.split(',')[0],
              country,
              state,
              geo_lat: lat,
              geo_long: lng,
              lat: formattedLat,
              long: formattedLng,
            };
            onPlaceSelected(data);
          }
        });
      };

      // Load CAPAC script
      const script = document.createElement('script');
      script.id = 'capac-script';
      const apiKey = import.meta.env.VITE_PLACES_API || 'AJSjkshjjSDkjhKDJDhjdjdklDldld';
      script.src = `https://placesapis.clickastro.com/capac/api/?key=${apiKey}&callback=CAPACInitListener`;
      script.async = true;
      script.onerror = (e) => console.error('Failed to load CAPAC script', e);
      document.body.appendChild(script);
    }, [inputId, onPlaceSelected]);

    return (
      <Box sx={{ width: '100%', height: '100%' }}>
        <InputBase
          fullWidth
          inputRef={inputRef}
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            onTyping?.(val); // <-- call parent handler
          }}
          placeholder={placeholder}
          className={className}
          sx={{ height: '100%', px: 1, fontSize: '13px' }}
          inputProps={{ 'aria-label': 'place', id: inputId, name }}
        />
      </Box>
    );
  }
);

export default PlaceAutoComplete;
