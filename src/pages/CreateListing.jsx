import React, { useState, useEffect, useRef } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db } from '../firebase.config'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { toast } from 'react-toastify'

function CreateListing() {

    // const api_key = process.env.REACT_APP_GEOCODE_API_KEY

    //eslint-disable-next-line
    const [geolocationEnabled, setGeolocationEnabled] = useState(true)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        type: 'rent',
        name: '',
        bedrooms: 1,
        bathrooms: 1,
        parking: false,
        furnished: false,
        address: '',
        offer: false,
        regularPrice: 0,
        offerPrice: 0,
        images: {},
        latitude: 0,
        longitude: 0
    })

    const { type, name, bedrooms, bathrooms, parking, furnished, address, offer, offerPrice, regularPrice, images, latitude, longitude } = formData

    const auth = getAuth()
    const navigate = useNavigate()
    const isMounted = useRef(true)

    useEffect(() => {
        if(isMounted){
            onAuthStateChanged(auth, (user) => {
                if(user){
                    setFormData({ ...formData, userRef: user.uid })
                } else {
                    navigate('/sign-in')
                }
            })
        }

        return () => {
            isMounted.current = false
        }
        //eslint-disable-next-line
    }, [isMounted])

    const onSubmit = async (e) => {
        e.preventDefault()
        // console.log(formData);
        setLoading(true)
        if(offerPrice >= regularPrice){
            setLoading(false)
            toast.error('Offer price should be less than regular price.')
            return
        }
        if(images.length > 6){
            setLoading(false)
            toast.error('Maximum 6 images allowed')
            return
        }

        let geolocation = {}
        let location

        if(geolocationEnabled){
            // const headers = {
                
            // }
            const response = await fetch(`http://api.positionstack.com/v1/forward?access_key=${process.env.REACT_APP_GEOCODE_API_KEY}&query=${address}`)

            const data = await response.json()
            geolocation.lat = data.data[0]?.latitude ?? 0
            geolocation.lng = data.data[0]?.longitude ?? 0
            location = data.data[0]?.label ?? 0
            // console.log(data.data.length)
            // console.log(data.data[0].longitude)
            if(data.data.length < 1){
                setLoading(false)
                toast.error('Please enter a valid address')
                return
            }

            // console.log(geolocation)
            // console.log(location)

        } else {
            geolocation.lat = latitude
            geolocation.lng = longitude
            //eslint-disable-next-line
            location = address
        }

        //Store Image in firebase
        const storeImage = async (image) => {
            return new Promise((resolve, reject) => {
              const storage = getStorage()
              const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`
      
              const storageRef = ref(storage, 'images/' + fileName)
      
              const uploadTask = uploadBytesResumable(storageRef, image)
      
              uploadTask.on(
                'state_changed',
                (snapshot) => {
                  const progress =
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                  console.log('Upload is ' + progress + '% done')
                  switch (snapshot.state) {
                    case 'paused':
                      console.log('Upload is paused')
                      break
                    case 'running':
                      console.log('Upload is running')
                      break
                    default:
                      break
                  }
                },
                (error) => {
                  reject(error)
                },
                () => {
                  // Handle successful uploads on complete
                  // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                  getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL)
                  })
                }
              )
            })
          }
      
          const imageUrls = await Promise.all(
            [...images].map((image) => storeImage(image))
          ).catch(() => {
            setLoading(false)
            toast.error('Images not uploaded')
            return
          }) 

        // console.log(imageUrls)
        const formDataCopy = {
            ...formData,
            imageUrls,
            geolocation,
            timestamp: serverTimestamp(),
          }
      
          formDataCopy.location = address
          delete formDataCopy.images
          delete formDataCopy.address
          !formDataCopy.offer && delete formDataCopy.discountedPrice
      
          const docRef = await addDoc(collection(db, 'listings'), formDataCopy)
          setLoading(false)
          toast.success('Listing saved')
          navigate(`/category/${formDataCopy.type}/${docRef.id}`)
    }

    const onMutate = (e) => {
        let boolean = null
        if(e.target.value === 'true'){
            boolean = true
        }
        if(e.target.value === 'false'){
            boolean = false
        }

        //Files
        if(e.target.files){
            setFormData((prevState) => ({
                ...prevState,
                images: e.target.files
            }))
        }
        //Numbers Booleans and Text
        if(!e.target.files){
            setFormData((prevState) => ({
                ...prevState,
                [e.target.id] : boolean ?? e.target.value
            }))
        }
    }

    if(loading){
        return <Spinner />
    }

    return (
        <div className="profile">
            <header>
                <p className="pageHeader">
                    Create a listing
                </p>
            </header>
            <main>
                <form onSubmit={onSubmit}>
                    <label className="formLabel">Sell / Rent</label>
                    <div className="formButtons">
                        <button
                            type='button'
                            className={ type === 'sale' ? 'formButtonActive' : 'formButton'}
                            id='type'
                            value='sale'
                            onClick={onMutate}
                        >
                            Sell
                        </button>
                        <button
                            type='button'
                            className={ type === 'rent' ? 'formButtonActive' : 'formButton'}
                            id='type'
                            value='rent'
                            onClick={onMutate}
                        >
                            Rent
                        </button>
                    </div>
                    <label className="formLabel">Name</label>
                    <input 
                        type="text" 
                        id="name" 
                        className="formInput" 
                        value={name}
                        onChange={onMutate}    
                        maxLength='32'
                        minLength='10'
                        required
                    />
                    <div className="formRooms flex">
                        <div>
                            <label htmlFor="" className="formLabel">Bedrooms</label>
                            <input 
                                type="number" 
                                id="bedrooms" 
                                className="formInputSmall" 
                                value={bedrooms}
                                onChange={onMutate}
                                min='1'
                                max='50'
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="" className="formLabel">Bathrooms</label>
                            <input 
                                type="number" 
                                id="bathrooms" 
                                className="formInputSmall" 
                                value={bathrooms}
                                onChange={onMutate}
                                min='1'
                                max='50'
                                required
                            />
                        </div>
                    </div>
                    <label htmlFor="" className='formLabel'>Parking</label>
                    <div className="formButtons">
                    <button
                        className={parking ? 'formButtonActive' : 'formButton'}
                        type='button'
                        id='parking'
                        value={true}
                        onClick={onMutate}
                        min='1'
                        max='50'
                    >
                        Yes
                    </button>
                    <button
                        className={
                            !parking && parking !== null ? 'formButtonActive' : 'formButton'
                        }
                        type='button'
                        id='parking'
                        value={false}
                        onClick={onMutate}
                    >
                        No
                    </button>
                    </div>
                    <label className='formLabel'>Furnished</label>
                    <div className="formButtons">
                    <button
                        className={furnished ? 'formButtonActive' : 'formButton'}
                        type='button'
                        id='furnished'
                        value={true}
                        onClick={onMutate}
                    >
                    Yes
                    </button>
                    <button
                        className={
                            !furnished && furnished !== null
                            ? 'formButtonActive'
                            : 'formButton'
                        }
                        type='button'
                        id='furnished'
                        value={false}
                        onClick={onMutate}
                    >
                        No
                    </button>
                    </div>
                    <label className="formLabel">Address</label>
                    <textarea
                        className='formInputAddress'
                        type='text'
                        id='address'
                        value={address}
                        onChange={onMutate}
                        required
                    />
                    {!geolocationEnabled && (
                        <div className="formLatLng flex">
                            <div>
                                <label className="formLabel">Latitude</label>
                                <input 
                                    type="number" 
                                    id="latitude"
                                    className="formInputSmall" 
                                    value={latitude}    
                                    onChange={onMutate}
                                    required
                                />
                            </div>
                            <div>
                                <label className="formLabel">Longitude</label>
                                <input 
                                    type="number" 
                                    id="longitude"
                                    className="formInputSmall" 
                                    value={longitude}    
                                    onChange={onMutate}
                                    required
                                />
                            </div>
                        </div>
                    )}
                    <label htmlFor="" className='formLabel'>Offer</label>
                    <div className="formButtons">
                    <button
                        className={offer ? 'formButtonActive' : 'formButton'}
                        type='button'
                        id='offer'
                        value={true}
                        onClick={onMutate}
                    >
                        Yes
                    </button>
                    <button
                        className={
                            !offer && offer !== null ? 'formButtonActive' : 'formButton'
                        }
                        type='button'
                        id='offer'
                        value={false}
                        onClick={onMutate}
                    >
                        No
                    </button>
                    </div>
                    <label className="formLabel">
                        Regular Price
                    </label>
                    <div className="formPriceDiv">
                        <input 
                            type="number" 
                            id="regularPrice" 
                            className="formInputSmall" 
                            value={regularPrice}
                            onChange={onMutate}    
                            min='50'
                            max='75000000'
                            required
                        />
                        {type === 'rent' && (
                            <p className="formPriceText">/ Month</p>
                        )}
                    </div>
                    {offer && (
                        <>
                            <label className="formLabel">Offer</label>
                            <input 
                                className='formInputSmall'
                                type='number'
                                id='offerPrice'
                                value={offerPrice}
                                onChange={onMutate}
                                min='50'
                                max='75000000'
                                required
                            />
                        </>
                    )}
                    <label className="formLabel">Images</label>
                    <p className="imagesInfo">
                        The first image will be the cover. (Max 6 images)
                    </p>
                    <input 
                        type="file" 
                        id="images" 
                        className="formInputFile" 
                        onChange={onMutate}    
                        max='6'
                        accept='.jpg,.png,.jpeg'
                        multiple
                        required
                    />
                    <button 
                        type="submit" 
                        className="primaryButton createListingButton"
                    >Create Listing</button>
                </form>
            </main>
        </div>
    )
}

export default CreateListing