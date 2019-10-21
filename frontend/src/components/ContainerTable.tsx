import { IPart, IContainer } from "../types";
import * as React from 'react';
import { Table } from "element-react";

interface IProps {
  containers?: IContainer[]
}

interface IState {

}

export default class ContainerTable extends React.Component<IProps, IState> {
  private columns = [
    {
      label: "barcode",
      prop: "barcode",
    }, {
      label: "type",
      prop: "ctype",
    }, {
      label: "date",
      render: (data:any) => <div>{new Date((data as any).assignedAt).toLocaleDateString()}</div>
    },
    {
      label: "locationBarcode",
      prop: "locationBarcode",
    },
    {
      label: "currentStatus",
      prop: "currentStatus",
    },
  ]

  constructor(props: IProps) {
    super(props);
  }

  public render () {
    const {containers} = this.props;

    return containers ? <Table
      columns = {this.columns}
      data = {containers}
    /> : <div>no containers</div>
  }
}