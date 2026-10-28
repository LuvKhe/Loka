interface Props {
  url?: string | null
  name?: string | null
  size?: number
}

export default function Avatar({ url, name, size = 40 }: Props) {
  const dimension = { width: size, height: size }

  if (url) {
    return (
      <img
        src={url}
        alt={name ? `Profile photo of ${name}` : 'Profile photo'}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={dimension}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className="rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0"
      style={dimension}
    >
      <span
        className="text-blue-600 dark:text-blue-400 font-semibold"
        style={{ fontSize: Math.round(size * 0.4) }}
      >
        {name?.[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  )
}
