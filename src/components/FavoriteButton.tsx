interface FavoriteButtonProps {
  isFavorite: boolean
  label: string
  onClick: () => void
}

function FavoriteButton({
  isFavorite,
  label,
  onClick,
}: FavoriteButtonProps) {
  return (
    <button
      className="favorite-star"
      type="button"
      aria-label={`${isFavorite ? 'Remove' : 'Add'} ${label} ${
        isFavorite ? 'from' : 'to'
      } favorites`}
      aria-pressed={isFavorite}
      onClick={onClick}
    >
      <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
    </button>
  )
}

export default FavoriteButton
