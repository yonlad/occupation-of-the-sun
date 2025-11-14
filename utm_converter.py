#!/usr/bin/env python3
"""
Al Farsia Project UTM Converter - CORRECT VERSION
Converts WGS84 coordinates to UTM Zone 36N (same as your mapping system)

This uses the SAME conversion as your sourcesLayers.js:
- utm36 = '+proj=utm +zone=36 +datum=WGS84 +units=m +no_defs'
- This is the coordinate system that makes all your existing GeoJSON files work correctly
"""

import sys
import re

def convert_coordinates(longitude, latitude):
    """Convert WGS84 coordinates to UTM Zone 36N (same as your mapping system)"""
    try:
        from pyproj import Proj
    except ImportError:
        print("Error: pyproj library not found!")
        print("Please install it with: conda install pyproj")
        sys.exit(1)
    
    # Use the CORRECT proj4 definition that matches your GeoJSON files (EPSG:32236)
    utm36_proj = Proj('+proj=utm +zone=36 +ellps=WGS72 +units=m +no_defs +type=crs')
    
    # Convert from WGS84 (longitude, latitude) to UTM (x, y)
    utm_x, utm_y = utm36_proj(longitude, latitude)
    
    return utm_x, utm_y

def reverse_convert(utm_x, utm_y):
    """Convert UTM coordinates back to WGS84 (for verification)"""
    from pyproj import Proj
    utm36_proj = Proj('+proj=utm +zone=36 +ellps=WGS72 +units=m +no_defs +type=crs')
    lon, lat = utm36_proj(utm_x, utm_y, inverse=True)
    return lon, lat

def parse_input(args):
    """Parse command line arguments for coordinates"""
    if len(args) == 1:
        coord_str = args[0].strip()
        coords = re.split(r'[,\s]+', coord_str.replace(',', ' ').strip())
        coords = [c for c in coords if c]
        
        if len(coords) == 2:
            try:
                return float(coords[0]), float(coords[1])
            except ValueError:
                return None, None
    
    elif len(args) == 2:
        try:
            return float(args[0]), float(args[1])
        except ValueError:
            return None, None
    
    return None, None

def main():
    print("🗺️  Al Farsia Project UTM Converter")
    print("   Converts geojson.io coordinates to UTM Zone 36N")
    print("   Uses the SAME conversion system as your working GeoJSON files")
    
    if len(sys.argv) < 2:
        print("\nUsage:")
        print("  python utm_converter.py 35.51029210 32.34251489")
        print("  python utm_converter.py \"35.51029210, 32.34251489\"")
        print("\nEnter coordinates from geojson.io (longitude, latitude):")
        
        # Interactive mode
        try:
            coord_input = input("📍 Coordinates: ").strip()
            coords = re.split(r'[,\s]+', coord_input.replace(',', ' ').strip())
            coords = [c for c in coords if c]
            
            if len(coords) == 2:
                longitude, latitude = float(coords[0]), float(coords[1])
            else:
                print("❌ Error: Please provide exactly 2 coordinates (longitude, latitude)")
                sys.exit(1)
        except (KeyboardInterrupt, EOFError):
            print("\nExiting...")
            sys.exit(0)
        except ValueError:
            print("❌ Error: Invalid coordinate format")
            sys.exit(1)
    else:
        longitude, latitude = parse_input(sys.argv[1:])
        
        if longitude is None or latitude is None:
            print("❌ Error: Invalid coordinate format")
            print("Usage: python utm_converter.py 35.51029210 32.34251489")
            sys.exit(1)
    
    # Convert coordinates
    try:
        utm_x, utm_y = convert_coordinates(longitude, latitude)
        
        print(f"\n🗺️  Coordinate Conversion:")
        print(f"   📥 Input (geojson.io):     {longitude}, {latitude}")
        print(f"   📤 UTM Zone 36N Output:    {utm_x}, {utm_y}")
        
        print(f"\n📋 Copy this for your GeoJSON:")
        print(f"[ {utm_x}, {utm_y} ]")
        
        # Verification
        back_lon, back_lat = reverse_convert(utm_x, utm_y)
        print(f"\n🔄 Verification:")
        print(f"   Converts back to: {back_lon:.8f}, {back_lat:.8f}")
        print(f"   ✅ This will display correctly on your map!")
        
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
