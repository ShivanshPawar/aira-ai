import { useEffect, useState } from 'react'
import { Camera, Eye, EyeOff, KeyRound, LogOut, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useChangePasswordMutation, useGetCurrentUserQuery, useLogoutMutation, useUpdateProfileMutation } from '../authApi.js'
import { useUploadFileMutation } from '../../files/filesApi.js'
import { validateAttachment } from '../../files/fileValidation.js'
import { ROUTES } from '../../../constants/routes.js'
import { getErrorMessage } from '../../../services/api/apiError.js'

const passwordFields = [['currentPassword', 'Current password'], ['newPassword', 'New password'], ['confirmPassword', 'Confirm new password']]

const ProfilePage = () => {
  const navigate = useNavigate()
  const { data: user } = useGetCurrentUserQuery()
  const [updateProfile, updateProfileState] = useUpdateProfileMutation()
  const [uploadFile, uploadFileState] = useUploadFileMutation()
  const [changePassword, changePasswordState] = useChangePasswordMutation()
  const [logout, logoutState] = useLogoutMutation()
  const [name, setName] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [visible, setVisible] = useState({ currentPassword: false, newPassword: false, confirmPassword: false })
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  useEffect(() => { if (user?.name) setName(user.name) }, [user?.name])

  const saveProfile = async (event) => {
    event.preventDefault()
    setProfileError(''); setProfileMessage('')
    try { await updateProfile({ name }).unwrap(); setProfileMessage('Profile saved.') } catch (error) { setProfileError(getErrorMessage(error, 'Could not update your profile.')) }
  }

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setProfileError(''); setProfileMessage('')
    if (!file.type.startsWith('image/')) return setProfileError('Choose an image for your avatar.')
    const validationError = validateAttachment(file)
    if (validationError) return setProfileError(validationError)
    try { const uploaded = await uploadFile(file).unwrap(); await updateProfile({ avatarFileId: uploaded._id }).unwrap(); setProfileMessage('Avatar updated.') } catch (error) { setProfileError(getErrorMessage(error, 'Could not update your avatar.')) }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    setPasswordError(''); setPasswordMessage('')
    if (passwords.newPassword !== passwords.confirmPassword) return setPasswordError('New password confirmation does not match.')
    try {
      await changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }).unwrap()
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMessage('Password updated. Other signed-in devices have been signed out.')
    } catch (error) { setPasswordError(getErrorMessage(error, 'Could not update your password.')) }
  }

  const signOut = async () => {
    try { await logout().unwrap() } catch { /* The mutation clears local auth state even if the request fails. */ }
    navigate(ROUTES.login, { replace: true })
  }

  return <section className="scrollbar-hidden mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto overscroll-contain px-5 py-10 pb-12 sm:px-10">
    <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#70b9ed]"><UserRound size={13} /> Account</p>
    <h1 className="text-4xl font-semibold">Your profile</h1><p className="mt-2 text-sm text-[#92958c]">Manage your identity, avatar, and account security.</p>
    <section className="mt-10 border-t border-white/10 pt-7">
      <div className="flex items-center gap-3"><div className="relative size-14 shrink-0"><div className="grid size-full place-items-center overflow-hidden rounded-full border border-white/15 bg-[#191b17] text-lg font-semibold text-[#d8f36a]">{user?.avatar?.url ? <img alt="Your avatar" className="size-full object-cover" src={user.avatar.url} /> : user?.name?.slice(0, 1).toUpperCase()}</div><label aria-label={uploadFileState.isLoading ? 'Uploading avatar' : 'Change avatar'} className={`absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-[#111310] bg-[#d8f36a] text-[#171912] transition hover:bg-[#e5ff85] ${uploadFileState.isLoading || updateProfileState.isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`} title={uploadFileState.isLoading ? 'Uploading avatar' : 'Change avatar'}><Camera aria-hidden="true" size={12} /><input accept="image/*" aria-label="Change avatar" className="sr-only" disabled={uploadFileState.isLoading || updateProfileState.isLoading} onChange={uploadAvatar} type="file" /></label></div><div><h2 className="text-sm font-semibold">Profile details</h2><p className="mt-1 text-xs text-[#92958c]">Your name and avatar appear in the navigation.</p></div></div>
      <form className="mt-5 grid max-w-sm gap-4 sm:grid-cols-[1fr_auto] sm:items-end" onSubmit={saveProfile}><label className="grid gap-2 text-xs font-semibold text-[#c9ccc4]">Display name<input className="h-10 border border-white/15 bg-[#191b17] px-3 text-sm font-normal text-[#f4f0e8] outline-none focus:border-[#d8f36a]" disabled={updateProfileState.isLoading} maxLength={50} minLength={3} onChange={(event) => setName(event.target.value)} required value={name} /></label><button className="flex h-10 items-center justify-center gap-2 border border-[#d8f36a] bg-[#d8f36a] px-3 text-xs font-semibold text-[#171912] transition hover:bg-[#e5ff85] disabled:opacity-50" disabled={updateProfileState.isLoading} type="submit"><UserRound size={14} />{updateProfileState.isLoading ? 'Saving...' : 'Save profile'}</button></form>
      {profileError && <p aria-live="polite" className="mt-3 text-xs text-[#f5a89b]">{profileError}</p>}{profileMessage && <p aria-live="polite" className="mt-3 text-xs text-[#d8f36a]">{profileMessage}</p>}
    </section>
    <section className="mt-10 border-t border-white/10 pt-7"><h2 className="text-sm font-semibold">Password</h2><p className="mt-1 text-xs leading-5 text-[#92958c]">Use your current password to set a new one. Other signed-in devices will be signed out.</p><form className="mt-5 grid max-w-sm gap-3" onSubmit={savePassword}>{passwordFields.map(([field, label]) => <label className="grid gap-2 text-xs font-semibold text-[#c9ccc4]" key={field}>{label}<span className="relative"><input autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'} className="h-10 w-full border border-white/15 bg-[#191b17] px-3 pr-10 text-sm font-normal text-[#f4f0e8] outline-none focus:border-[#d8f36a]" disabled={changePasswordState.isLoading} minLength={field === 'currentPassword' ? undefined : 8} onChange={(event) => setPasswords((current) => ({ ...current, [field]: event.target.value }))} required type={visible[field] ? 'text' : 'password'} value={passwords[field]} /><button aria-label={visible[field] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} className="absolute right-0 top-0 grid size-10 place-items-center text-[#92958c] hover:text-[#d8f36a]" disabled={changePasswordState.isLoading} onClick={() => setVisible((current) => ({ ...current, [field]: !current[field] }))} type="button">{visible[field] ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>)}<button className="mt-1 flex h-10 w-fit items-center gap-2 border border-[#d8f36a] bg-[#d8f36a] px-3 text-xs font-semibold text-[#171912] transition hover:bg-[#e5ff85] disabled:opacity-50" disabled={changePasswordState.isLoading} type="submit"><KeyRound size={14} />{changePasswordState.isLoading ? 'Updating...' : 'Update password'}</button></form>{passwordError && <p aria-live="polite" className="mt-3 text-xs text-[#f5a89b]">{passwordError}</p>}{passwordMessage && <p aria-live="polite" className="mt-3 text-xs text-[#d8f36a]">{passwordMessage}</p>}</section>
    <section className="mt-10 border-t border-white/10 pt-7"><h2 className="text-sm font-semibold">Private session</h2><p className="mt-1 max-w-lg text-xs leading-5 text-[#92958c]">Signing out ends your current session on this device.</p><button className="mt-5 flex h-10 items-center gap-2 border border-[#f07865]/40 px-3 text-xs font-semibold text-[#f5a89b] hover:bg-[#f07865]/10 disabled:opacity-50" disabled={logoutState.isLoading} onClick={signOut} type="button"><LogOut size={15} />{logoutState.isLoading ? 'Signing out...' : 'Sign out'}</button></section>
  </section>
}

export default ProfilePage
