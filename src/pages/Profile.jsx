import React, { useState, useEffect } from 'react'
import { getAuth, updateProfile } from 'firebase/auth'
import { doc, updateDoc, collection, getDocs, query, orderBy, where, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase.config'
import { useNavigate, Link } from 'react-router-dom'
import arrowRight from '../assets/svg/keyboardArrowRightIcon.svg'
import homeIcon from '../assets/svg/homeIcon.svg'
import ListingItem from '../components/ListingItem'
import { toast } from 'react-toastify'

function Profile() {

  const auth = getAuth()
  const navigate = useNavigate()

  const [listings, setListings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [changeDetails, setChangeDetails] = useState(false)
  const [formData, setFormData] = useState({
    name: auth.currentUser.displayName,
    email: auth.currentUser.email
  })

  const { name, email } = formData

  useEffect(() => {
    const fetchUserListings = async () => {
      const listingsRef = collection(db, 'listings')
      const q = query(listingsRef, where('userRef', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'))
      const querySnap = await getDocs(q)

      let listings = []

      querySnap.forEach((doc) => {
        return listings.push({
          id: doc.id,
          data: doc.data()
        })
      })

      setListings(listings)
      setLoading(false)

    }

    fetchUserListings()
  }, [auth.currentUser.uid])

  const onLogOut = () => {
    auth.signOut()
    navigate('/')
  }

  const onSubmit = async () => {
    // e.preventDefault()
    // console.log(123);
    try {
      if(auth.currentUser.displayName !== name){
        //Update display name in firebase
        await updateProfile(auth.currentUser, {
          displayName: name
        })
      }
      //Update in firestore
      const userRef = doc(db, 'users', auth.currentUser.uid)
      await updateDoc(userRef, {name})
    } catch (error) {
      
    }
  }

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value
    }))
  }

  const onDelete = async (listingId) => {
    if(window.confirm('Are you sure, you want to delete?')){
      await deleteDoc(doc(db, 'listings', listingId))
      const updateListings = listings.filter((listing) => listing.id !== listingId)
      setListings(updateListings)
      toast.success('Successfully removed listing')
    }
  }

  const onEdit = (listingId) => navigate(`/edit-listing/${listingId}`)

  return (
    <div className="profile">
      <header className="profileHeader">
        <p className="pageHeader">My Profile</p>
        <button 
          type='button' 
          className="logOut"
          onClick={onLogOut}  
        >Logout</button>
      </header>

      <main>
        <div className="profileDetailsHeader">
          <p className="profileDetailsText">Personal Details</p>
          <p 
            className="changePersonalDetails"
            onClick={() => {
              changeDetails && onSubmit()
              setChangeDetails((prevState) => !prevState)
            }}  
          >
            {changeDetails ? 'done' : 'change'}
          </p>
        </div>
        <div className="profileCard">
          <form>
            <input 
              type="text" 
              id="name" 
              className={!changeDetails ? 'profileName' : 'profileNameActive'} 
              disabled={!changeDetails}
              value={name} 
              onChange={onChange}
            />
            <input 
              type="email" 
              id="email" 
              className={!changeDetails ? 'profileEmail' : 'profileEmailActive'} 
              disabled={!changeDetails}
              value={email} 
              onChange={onChange}
            />
          </form>
        </div>
        <Link to='/create-listing' className="createListing">
          <img src={homeIcon} alt="home-icon" />
          <p>Sell or Rent your Home</p>
          <img src={arrowRight} alt="arrow-right" />
        </Link>
        {!loading && listings?.length > 0 && (
          <>
            <p className="listingText">
              Your Listings
            </p>
            <ul className="listingsList">
              {listings.map((listing) => (
                <ListingItem 
                  key={listing.id} 
                  listing={listing.data} 
                  id={listing.id} 
                  onDelete={() => onDelete(listing.id)}
                  onEdit={() => onEdit(listing.id)}
                />
              ))}
            </ul>
          </>
        )}
      </main>

    </div>
  )
}

export default Profile