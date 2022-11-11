import {useMemo} from "react";

function useRepeat({count, render}: {count: number, render: (index: number) => React.ReactElement}) {
  return useMemo(() => new Array(count).fill(null).map((_, i) => render(i)), [count, render])
}
