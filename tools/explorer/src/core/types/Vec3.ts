export class Vec3 {
    public x: number;
    public y: number;
    public z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public toArray() {
        return [
            this.x,
            this.y,
            this.z,
        ];
    }
}
