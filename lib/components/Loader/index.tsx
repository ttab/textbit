import './style.css'

export function Loader() {
  return <>
    <div className='appear-loading'>
      <div>
        <div className='dot dot-1'></div>
        <div className='dot dot-2'></div>
        <div className='dot dot-3'></div>
      </div>
      <svg style={{ display: 'none' }} xmlns='http://www.w3.org/2000/svg' version='1.1'>
        <defs>
          <filter id='goo'>
            <feGaussianBlur in='SourceGraphic' stdDeviation='8' result='blur' />
            <feColorMatrix in='blur' mode='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9' result='goo' />
            <feComposite in='SourceGraphic' in2='goo' operator='atop' />
          </filter>
        </defs>
      </svg>
    </div>
  </>
}
