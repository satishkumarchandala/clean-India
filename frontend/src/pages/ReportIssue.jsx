import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import './ReportIssue.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
const LocationMarker = ({ position, setPosition, setFormData }) => {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      map.flyTo([lat, lng], map.getZoom());
      
      // Update form data with new coordinates (high precision)
      setFormData(prev => ({
        ...prev,
        latitude: lat.toFixed(8),
        longitude: lng.toFixed(8),
      }));

      // Get address from coordinates with better accuracy
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          if (data.display_name) {
            setFormData(prev => ({
              ...prev,
              address: data.display_name,
            }));
            toast.success('📍 Location selected! Zoom in for better accuracy.');
          }
        })
        .catch(err => console.error('Error getting address:', err));
    },
  });

  return position ? <Marker position={position} /> : null;
};

const ReportIssue = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'road',
    priority: 'medium',
    address: '',
    latitude: '',
    longitude: '',
  });
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center
  const [markerPosition, setMarkerPosition] = useState(null);

  // Get user's location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.log('Could not get current location for map center');
        }
      );
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        toast.error('Image size should be less than 16MB');
        return;
      }
      
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData({
          ...formData,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        });

        // Update map center and marker
        setMapCenter([latitude, longitude]);
        setMarkerPosition([latitude, longitude]);

        // Try to get address from coordinates using reverse geocoding with high zoom
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setFormData(prev => ({
              ...prev,
              latitude: latitude.toFixed(8),
              longitude: longitude.toFixed(8),
              address: data.display_name,
            }));
          }
        } catch (error) {
          console.error('Error getting address:', error);
        }
        
        setGettingLocation(false);
        toast.success('Location captured successfully!');
      },
      (error) => {
        setGettingLocation(false);
        toast.error('Unable to get your location. Please enter manually.');
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.latitude || !formData.longitude) {
      toast.error('Please provide location coordinates');
      return;
    }

    if (parseFloat(formData.latitude) === 0 && parseFloat(formData.longitude) === 0) {
      toast.error('Invalid coordinates. Please use "Get Current Location" or enter valid coordinates');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('priority', formData.priority);
      submitData.append('latitude', formData.latitude);
      submitData.append('longitude', formData.longitude);
      submitData.append('address', formData.address);
      
      if (image) {
        submitData.append('image', image);
      }

      const response = await api.post('/api/issues', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Issue reported successfully!');
      navigate(`/issue/${response.data.data._id}`);
    } catch (error) {
      console.error('Error reporting issue:', error);
      
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(err.msg || err.message);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to report issue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-container">
      <div className="container">
        <div className="report-header">
          <h1>🚨 Report an Issue</h1>
          <p>Help make your community better by reporting infrastructure issues</p>
        </div>

        <div className="report-card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">
                  Issue Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-control"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  minLength={5}
                  maxLength={200}
                  placeholder="Brief description of the issue"
                />
                <small>{formData.title.length}/200 characters</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Detailed Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                value={formData.description}
                onChange={handleChange}
                required
                minLength={10}
                maxLength={5000}
                rows={6}
                placeholder="Provide detailed information about the issue..."
              />
              <small>{formData.description.length}/5000 characters</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">
                  Category <span className="required">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  className="form-control"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="road">🛣️ Road</option>
                  <option value="electricity">⚡ Electricity</option>
                  <option value="water">💧 Water</option>
                  <option value="sanitation">🗑️ Sanitation</option>
                  <option value="transport">🚌 Transport</option>
                  <option value="infrastructure">🏗️ Infrastructure</option>
                  <option value="environment">🌳 Environment</option>
                  <option value="others">📋 Others</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority Level</label>
                <select
                  id="priority"
                  name="priority"
                  className="form-control"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">
                Location Address <span className="required">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleChange}
                required
                maxLength={500}
                placeholder="Street address or landmark"
              />
            </div>

            <div className="location-section">
              <h3>📍 Select Location</h3>
              <p className="help-text" style={{ color: '#666', marginBottom: '10px' }}>
                🎯 <strong>For best accuracy:</strong> Click "Use My Current Location" or click on the map, then zoom in (scroll/pinch) to street level and click exactly where the issue is located.
              </p>
              
              <button
                type="button"
                className="btn btn-primary"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                style={{ marginBottom: '15px' }}
              >
                {gettingLocation ? '📍 Getting Location...' : '📍 Use My Current Location'}
              </button>

              <div className="map-container" style={{ height: '500px', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <MapContainer
                  center={mapCenter}
                  zoom={18}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%' }}
                >
                  {/* High Detail Street Map */}
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />
                  <LocationMarker 
                    position={markerPosition} 
                    setPosition={setMarkerPosition}
                    setFormData={setFormData}
                  />
                </MapContainer>
              </div>
              
              <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
                💡 <strong>Tip:</strong> Zoom in as close as possible (scroll wheel or pinch) to see individual buildings and roads for pinpoint accuracy.
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="latitude">
                    Latitude <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    className="form-control"
                    value={formData.latitude}
                    onChange={handleChange}
                    required
                    step="any"
                    min="-90"
                    max="90"
                    placeholder="e.g., 40.7589"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="longitude">
                    Longitude <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    className="form-control"
                    value={formData.longitude}
                    onChange={handleChange}
                    required
                    step="any"
                    min="-180"
                    max="180"
                    placeholder="e.g., -73.9851"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="image">Upload Image (Optional)</label>
              <input
                type="file"
                id="image"
                className="form-control"
                onChange={handleImageChange}
                accept="image/png,image/jpg,image/jpeg,image/gif"
              />
              <small>Max size: 16MB. Formats: PNG, JPG, JPEG, GIF</small>
              
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '📤 Submitting...' : '📤 Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
