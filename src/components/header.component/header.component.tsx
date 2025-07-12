  import { Assets } from '@/constants/assets'

  
  const Header = () => {
    return (
      <div className='flex flex-row w-full items-center'>
        <img src={Assets.ICON} alt={Assets.ICON_ALT} width={Assets.ICON_WIDTH} height={Assets.ICON_HEIGHT} />
      </div>
    )
  }
  
  export default Header