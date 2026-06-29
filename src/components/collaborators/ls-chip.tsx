import { Chip, Text } from "@mantine/core";
import { ReactNode, useState } from "react";

export default function LSChip (
  {defaultChecked, value, children}
  :
  {defaultChecked?: boolean, value: string, children: ReactNode}
) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <Chip 
      defaultChecked={defaultChecked} 
      icon={<></>} 
      value='all' 
      variant={checked ? 'filled' : 'outline'}
      styles={{
        iconWrapper: {
          display: 'none',
        },
        label: {
          paddingInline: '12px',
          paddingBlock: '6px'
        },
      }}
      onClick={() => setChecked(!checked)}
      color='navy.7'
    >
      <Text fz='0.75rem' c={checked ? 'white' : 'navy.7'}>{children}</Text>
    </Chip>
  )
}