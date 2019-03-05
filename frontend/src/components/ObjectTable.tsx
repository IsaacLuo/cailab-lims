import * as React from 'react';
import { Table } from "element-react";

interface IProps {
  keys: string[],
  object: any,
}

interface IState {

}

export default class ObjectTable extends React.Component<IProps, IState> {
  private columns = [
    {
      label: "key",
      prop: "key",
      align: "right",
      width: 200,
    }, {
      label: "value",
      prop: "value",
    },
  ]

  constructor(props: IProps) {
    super(props);
  }

  public render () {
    const {keys, object} = this.props;
    const tableData = 
    keys.map(
      v => ({key: v, value:object[v] ? (Array.isArray(object[v]) ? object[v].join('; '): object[v]) : undefined})
    )
    return <Table
      columns = {this.columns}
      data = {tableData}
    />
  }
}