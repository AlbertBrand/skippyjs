export default function shard(array, numberOfShards) {
  var len = array.length,
    out = [],
    i = 0;
  while (i < len) {
    var size = Math.ceil((len - i) / numberOfShards--);
    out.push(array.slice(i, i += size));
  }
  return out;
}
