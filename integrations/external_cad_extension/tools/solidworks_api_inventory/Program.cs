using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

var options = Args.Parse(args);
if (string.IsNullOrWhiteSpace(options.SolidWorksDir) || string.IsNullOrWhiteSpace(options.OutPath))
{
    Console.Error.WriteLine("Usage: --solidworks-dir <path> --out <path>");
    return 2;
}

var redistDir = Path.Combine(options.SolidWorksDir, "api", "redist");
var assemblyPaths = new[]
{
    Path.Combine(redistDir, "SolidWorks.Interop.sldworks.dll"),
    Path.Combine(redistDir, "SolidWorks.Interop.swconst.dll"),
    Path.Combine(redistDir, "SolidWorks.Interop.swpublished.dll"),
};

var missing = assemblyPaths.Where(path => !File.Exists(path)).ToArray();
if (missing.Length > 0)
{
    Console.Error.WriteLine("Missing SolidWorks interop assemblies:");
    foreach (var item in missing)
    {
        Console.Error.WriteLine("  " + item);
    }
    return 3;
}

var assemblies = assemblyPaths.Select(Assembly.LoadFrom).ToArray();
var inventory = new ApiInventory
{
    GeneratedAtUtc = DateTimeOffset.UtcNow,
    SolidWorksDir = options.SolidWorksDir,
    Assemblies = assemblies.Select(ToAssemblyInventory).ToList()
};

var json = JsonSerializer.Serialize(
    inventory,
    new JsonSerializerOptions
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    });

var outDir = Path.GetDirectoryName(Path.GetFullPath(options.OutPath));
if (!string.IsNullOrWhiteSpace(outDir))
{
    Directory.CreateDirectory(outDir);
}

File.WriteAllText(options.OutPath, json);
Console.WriteLine("Wrote " + options.OutPath);
return 0;

static AssemblyInventory ToAssemblyInventory(Assembly assembly)
{
    var types = assembly.GetExportedTypes().OrderBy(type => type.FullName).ToArray();
    return new AssemblyInventory
    {
        Name = assembly.GetName().Name ?? assembly.FullName,
        Version = assembly.GetName().Version?.ToString(),
        Interfaces = types
            .Where(type => type.IsInterface)
            .Select(ToInterfaceInventory)
            .ToList(),
        Enums = types
            .Where(type => type.IsEnum)
            .Select(ToEnumInventory)
            .ToList(),
        Classes = types
            .Where(type => type.IsClass)
            .Select(type => type.FullName ?? type.Name)
            .ToList(),
    };
}

static InterfaceInventory ToInterfaceInventory(Type type)
{
    return new InterfaceInventory
    {
        Name = type.FullName ?? type.Name,
        Methods = type
            .GetMethods()
            .Where(method => !method.IsSpecialName)
            .OrderBy(method => method.Name)
            .Select(ToMethodInventory)
            .ToList(),
        Properties = type
            .GetProperties()
            .OrderBy(property => property.Name)
            .Select(property => new PropertyInventory
            {
                Name = property.Name,
                Type = FriendlyName(property.PropertyType),
                CanRead = property.CanRead,
                CanWrite = property.CanWrite,
            })
            .ToList(),
    };
}

static MethodInventory ToMethodInventory(MethodInfo method)
{
    return new MethodInventory
    {
        Name = method.Name,
        ReturnType = FriendlyName(method.ReturnType),
        Parameters = method
            .GetParameters()
            .Select(parameter => new ParameterInventory
            {
                Name = parameter.Name ?? "",
                Type = FriendlyName(parameter.ParameterType),
                Optional = parameter.IsOptional,
                IsOut = parameter.IsOut,
            })
            .ToList(),
    };
}

static EnumInventory ToEnumInventory(Type type)
{
    return new EnumInventory
    {
        Name = type.FullName ?? type.Name,
        Values = Enum
            .GetNames(type)
            .Select(name => new EnumValueInventory { Name = name, Value = Convert.ToInt64(Enum.Parse(type, name)) })
            .ToList(),
    };
}

static string FriendlyName(Type type)
{
    if (type.IsByRef)
    {
        return FriendlyName(type.GetElementType()!) + "&";
    }
    if (!type.IsGenericType)
    {
        return type.FullName ?? type.Name;
    }
    var name = type.Name.Split('`')[0];
    var args = string.Join(", ", type.GetGenericArguments().Select(FriendlyName));
    return name + "<" + args + ">";
}

internal sealed class Args
{
    public string? SolidWorksDir { get; init; }
    public string? OutPath { get; init; }

    public static Args Parse(string[] args)
    {
        string? solidWorksDir = null;
        string? outPath = null;
        for (var index = 0; index < args.Length; index++)
        {
            var item = args[index];
            if (item == "--solidworks-dir" && index + 1 < args.Length)
            {
                solidWorksDir = args[++index];
            }
            else if (item == "--out" && index + 1 < args.Length)
            {
                outPath = args[++index];
            }
        }
        return new Args { SolidWorksDir = solidWorksDir, OutPath = outPath };
    }
}

internal sealed class ApiInventory
{
    public DateTimeOffset GeneratedAtUtc { get; init; }
    public string? SolidWorksDir { get; init; }
    public List<AssemblyInventory> Assemblies { get; init; } = [];
}

internal sealed class AssemblyInventory
{
    public string? Name { get; init; }
    public string? Version { get; init; }
    public List<InterfaceInventory> Interfaces { get; init; } = [];
    public List<EnumInventory> Enums { get; init; } = [];
    public List<string> Classes { get; init; } = [];
}

internal sealed class InterfaceInventory
{
    public string? Name { get; init; }
    public List<MethodInventory> Methods { get; init; } = [];
    public List<PropertyInventory> Properties { get; init; } = [];
}

internal sealed class MethodInventory
{
    public string? Name { get; init; }
    public string? ReturnType { get; init; }
    public List<ParameterInventory> Parameters { get; init; } = [];
}

internal sealed class ParameterInventory
{
    public string Name { get; init; } = "";
    public string? Type { get; init; }
    public bool Optional { get; init; }
    public bool IsOut { get; init; }
}

internal sealed class PropertyInventory
{
    public string? Name { get; init; }
    public string? Type { get; init; }
    public bool CanRead { get; init; }
    public bool CanWrite { get; init; }
}

internal sealed class EnumInventory
{
    public string? Name { get; init; }
    public List<EnumValueInventory> Values { get; init; } = [];
}

internal sealed class EnumValueInventory
{
    public string? Name { get; init; }
    public long Value { get; init; }
}

