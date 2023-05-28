export class NodeImpl {
    chartNode;
    constructor(chartNode) {
        this.chartNode = chartNode;
    }
    get id() {
        return this.chartNode.id;
    }
    get type() {
        return this.chartNode.type;
    }
    get title() {
        return this.chartNode.title;
    }
    get visualData() {
        return this.chartNode.visualData;
    }
    get data() {
        return this.chartNode.data;
    }
}
