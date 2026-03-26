import React, { JSX } from 'react'

export default function CanvasOverlay(props: { ref: React.Ref<HTMLDivElement> }): JSX.Element {
  return (
    <div
      ref={props.ref}
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        left: '0px',
        top: '0px'
      }}
    />
  )
}
