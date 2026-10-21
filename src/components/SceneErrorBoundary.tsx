import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Catches render errors inside the 3D scene.
 *
 * The most common cause is WebGL being unavailable — an old GPU driver, a
 * headless browser, or a device that blocks it. Without this boundary the
 * whole React tree unmounts and the visitor gets a blank page. With it, the
 * Hall section degrades to a static message and the rest of the site keeps
 * working.
 */

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export default class SceneErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Enchanthia] The Great Hall failed to render:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <p className="font-cinzel text-xl text-stone-200 sm:text-2xl">
                The Hall is closed for repairs
              </p>
              <p className="mx-auto mt-3 max-w-sm text-sm text-stone-500">
                This device could not start the 3D Great Hall — its graphics
                engine is unavailable. The rest of the festival is open.
              </p>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
